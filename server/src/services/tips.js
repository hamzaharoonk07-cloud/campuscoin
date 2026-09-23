import Budget from '../models/Budget.js';
import Tip from '../models/Tip.js';
import Transaction from '../models/Transaction.js';
import { byCategory, categoryBaseline, monthTotals, budgetProgress, dailySeries } from './analytics.js';
import { startOfMonth } from '../utils/dates.js';
import { round2, formatMoney } from '../utils/money.js';

// ---------------------------------------------------------------------------
// Personalised saving tips engine
//
// Each rule below looks at the student's own numbers and, when it fires, states
// how much money it thinks the advice is worth per month. That figure is the
// `impact`, and ranking by it is what puts the most valuable advice on top of
// the dashboard instead of whichever rule happened to run first.
//
// Nothing here is generic advice: every tip quotes the student's real figures.
// ---------------------------------------------------------------------------

async function buildTips(user, month) {
  // Every figure quoted inside a tip is written in the student's own currency,
  // so the advice reads as a sentence rather than a raw database value. The
  // formatter is built per call rather than shared, so two students with
  // different currencies can never cross over on concurrent requests.
  const money = (n) => formatMoney(n, user.currency || 'PKR');
  const userId = user._id;
  const start = startOfMonth(month);

  const [totals, spending, baseline, budgets, days] = await Promise.all([
    monthTotals(userId, start),
    byCategory(userId, start, 'expense'),
    categoryBaseline(userId, start, 3),
    budgetProgress(Budget, userId, start),
    dailySeries(userId, start),
  ]);

  const tips = [];

  // 1. Categories running above the student's own recent average.
  for (const row of spending) {
    const base = baseline.get(String(row.categoryId));
    if (!base || base.monthsSeen < 2 || base.average <= 0) continue;
    const over = row.total - base.average;
    if (over <= 0 || over / base.average < 0.2) continue;

    tips.push({
      key: `above-average:${row.categoryId}`,
      title: `${Math.round((over / base.average) * 100)}% more on ${row.name} than usual`,
      body: `You have spent ${money(row.total)} on ${row.name} this month against a ${money(base.average)} average over your last ${base.monthsSeen} months. Going back to your own average would free up ${money(over)}.`,
      impact: round2(over),
      category: row.categoryId,
      categoryName: row.name,
    });
  }

  // 2. Budgets already broken, and budgets about to break.
  for (const budget of budgets) {
    if (budget.state === 'exceeded') {
      tips.push({
        key: `over-budget:${budget.category._id}`,
        title: `${budget.category.name} is over budget`,
        body: `Your ${budget.category.name} cap is ${money(budget.limitAmount)} and you are at ${money(budget.spent)}. Bringing it back within the cap saves ${money(budget.spent - budget.limitAmount)} next month.`,
        impact: round2(budget.spent - budget.limitAmount),
        category: budget.category._id,
        categoryName: budget.category.name,
      });
    } else if (budget.state === 'warning') {
      tips.push({
        key: `near-budget:${budget.category._id}`,
        title: `${budget.category.name} is at ${budget.pct}% of its budget`,
        body: `Only ${money(budget.remaining)} of your ${money(budget.limitAmount)} ${budget.category.name} budget is left this month. Holding the line protects that ${money(budget.remaining)}.`,
        impact: round2(budget.remaining),
        category: budget.category._id,
        categoryName: budget.category.name,
      });
    }
  }

  // 3. Lots of small purchases in one category - the classic student leak.
  for (const row of spending) {
    if (row.count < 6) continue;
    const average = row.total / row.count;
    if (average > row.total * 0.25) continue; // a few big buys, not a drip
    const weeklyCap = money((row.total / 4) * 0.8);
    tips.push({
      key: `small-spends:${row.categoryId}`,
      title: `${row.count} small ${row.name} purchases added up to ${money(row.total)}`,
      body: `Each one averages only ${money(average)}, which is why they are easy to miss. A weekly cap of ${weeklyCap} would bring the month down to about ${money(row.total * 0.8)}, saving ${money(row.total * 0.2)}.`,
      impact: round2(row.total * 0.2),
      category: row.categoryId,
      categoryName: row.name,
    });
  }

  // 4. Recurring charges - the money that leaves without a decision.
  const recurring = await Transaction.find({
    user: userId,
    type: 'expense',
    'recurring.enabled': true,
  }).populate('category', 'name');
  if (recurring.length >= 2) {
    const monthlyCostValue = round2(
      recurring.reduce((acc, t) => {
        const perMonth = t.recurring.frequency === 'weekly' ? t.amount * 4 : t.recurring.frequency === 'yearly' ? t.amount / 12 : t.amount;
        return acc + perMonth;
      }, 0)
    );
    const monthlyCost = money(monthlyCostValue);
    tips.push({
      key: 'recurring-audit',
      title: `${recurring.length} recurring charges cost you ${monthlyCost} a month`,
      body: `These renew on their own: ${recurring.slice(0, 4).map((t) => t.description || t.category?.name).filter(Boolean).join(', ')}. Cancelling the one you use least is usually the easiest saving you will make all term.`,
      impact: round2(monthlyCostValue / recurring.length),
      category: null,
      categoryName: '',
    });
  }

  // 5. Savings goal that the current pace will not reach.
  if (user.savingsGoal > 0) {
    const shortfall = user.savingsGoal - totals.balance;
    if (shortfall > 0) {
      const top = spending[0];
      tips.push({
        key: 'savings-goal',
        title: `You are ${money(shortfall)} short of your ${money(user.savingsGoal)} savings goal`,
        body: top
          ? `This month you kept ${money(totals.balance)}. ${top.name} is your largest category at ${money(top.total)} - trimming it by ${Math.min(100, Math.round((shortfall / top.total) * 100))}% would close the gap on its own.`
          : `This month you kept ${money(totals.balance)}. Logging your expenses will show where the gap is coming from.`,
        impact: round2(shortfall),
        category: top?.categoryId || null,
        categoryName: top?.name || '',
      });
    }
  }

  // 6. Spending more than came in.
  if (totals.income > 0 && totals.expense > totals.income) {
    tips.push({
      key: 'overspending',
      title: 'You are spending more than you received this month',
      body: `${money(totals.expense)} went out against ${money(totals.income)} in. That gap of ${money(totals.expense - totals.income)} has to come from savings or someone else - worth catching now rather than at the end of term.`,
      impact: round2(totals.expense - totals.income),
      category: null,
      categoryName: '',
    });
  }

  // 7. A single day that dwarfs the rest of the month.
  const spentDays = days.filter((d) => d.total > 0);
  if (spentDays.length >= 5) {
    const average = spentDays.reduce((acc, d) => acc + d.total, 0) / spentDays.length;
    const peak = spentDays.reduce((best, d) => (d.total > best.total ? d : best), spentDays[0]);
    if (peak.total > average * 3) {
      tips.push({
        key: `spike-day:${peak.date}`,
        title: `${money(peak.total)} went out on a single day`,
        body: `On ${peak.date} you spent ${money(peak.total)}, against a ${money(average)} average on the days you spend anything. One-off days like this are worth a quick look - they are often a purchase you meant to split or delay.`,
        impact: round2(peak.total - average),
        category: null,
        categoryName: '',
      });
    }
  }

  // 8. Nothing logged yet - the only tip that is not about money.
  if (totals.transactionCount === 0) {
    tips.push({
      key: 'get-started',
      title: 'Log your first few transactions',
      body: 'Campus Coin builds every tip from your own history, so it needs a week or two of entries before the advice gets specific. Start with the things you buy most often.',
      impact: 0,
      category: null,
      categoryName: '',
    });
  }

  return tips.sort((a, b) => b.impact - a.impact);
}

/**
 * Rebuilds this student's tips and saves them, keeping any pin or dismissal the
 * student already applied to the same advice.
 */
export async function refreshTips(user, month) {
  const generated = await buildTips(user, month);

  if (generated.length) {
    await Tip.bulkWrite(
      generated.map((tip) => ({
        updateOne: {
          filter: { user: user._id, key: tip.key },
          update: {
            // status is deliberately left out: a dismissed tip stays dismissed.
            $set: { ...tip, user: user._id, lastSeenAt: new Date() },
            $setOnInsert: { status: 'active' },
          },
          upsert: true,
        },
      })),
      { ordered: false }
    );
  }

  // Tips whose underlying condition no longer holds are cleared out, unless the
  // student pinned them.
  await Tip.deleteMany({
    user: user._id,
    key: { $nin: generated.map((t) => t.key) },
    status: { $ne: 'pinned' },
  });

  return listTips(user._id);
}

export async function listTips(userId, { includeDismissed = false } = {}) {
  const filter = { user: userId };
  if (!includeDismissed) filter.status = { $ne: 'dismissed' };
  const tips = await Tip.find(filter).sort({ status: 1, impact: -1 });
  // Pinned tips first, then by how much money the advice is worth.
  return tips.sort((a, b) => {
    if (a.status === 'pinned' && b.status !== 'pinned') return -1;
    if (b.status === 'pinned' && a.status !== 'pinned') return 1;
    return b.impact - a.impact;
  });
}
