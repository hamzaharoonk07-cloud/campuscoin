import Insight from '../models/Insight.js';
import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import { budgetProgress, byCategory, categoryBaseline, dailySeries, monthTotals, trend } from './analytics.js';
import { narrateInsight, llmEnabled } from './llm.js';
import { startOfMonth } from '../utils/dates.js';
import { round2, formatMoney } from '../utils/money.js';

// ---------------------------------------------------------------------------
// Monthly spending insights
//
// Every number here is computed from the database first. The optional language
// model only rewrites those facts into friendlier prose, so the figures a
// student reads always match the figures in their report.
// ---------------------------------------------------------------------------

const MIN_CHANGE_PCT = 15; // below this a month-to-month wobble is just noise
const MIN_CHANGE_AMOUNT = 100; // and a change this small is not worth mentioning

/** Collects the facts that both the built-in writer and the model work from. */
async function gatherFacts(user, month) {
  const start = startOfMonth(month);
  const [totals, spending, baseline, sixMonths] = await Promise.all([
    monthTotals(user._id, start),
    byCategory(user._id, start, 'expense'),
    categoryBaseline(user._id, start, 3),
    trend(user._id, start, 6),
  ]);

  // Categories that moved meaningfully against the student's own average.
  const highlights = spending
    .map((row) => {
      const base = baseline.get(String(row.categoryId));
      if (!base || base.monthsSeen < 2 || !base.average) return null;
      const changePct = round2(((row.total - base.average) / base.average) * 100);
      const changeAmount = Math.abs(row.total - base.average);
      if (Math.abs(changePct) < MIN_CHANGE_PCT || changeAmount < MIN_CHANGE_AMOUNT) return null;
      return {
        categoryName: row.name,
        amount: row.total,
        previousAmount: base.average,
        changePct,
        direction: changePct > 0 ? 'up' : 'down',
      };
    })
    .filter(Boolean)
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, 3);

  return {
    monthLabel: start.toLocaleString('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    totals,
    topCategory: spending[0] || null,
    categoryCount: spending.length,
    highlights,
    sixMonths,
    savingsGoal: user.savingsGoal || 0,
  };
}

/** The built-in writer. Always runs, and is the only writer when no API key is set. */
function writeSummary(facts, currency) {
  const money = (n) => formatMoney(n, currency);
  const { totals, topCategory, highlights, monthLabel } = facts;
  const sentences = [];

  if (totals.transactionCount === 0) {
    return {
      summaryText: `Nothing was logged for ${monthLabel} yet, so there is nothing to summarise. Add a few transactions and this page will fill in on its own.`,
      tipText: 'Start with the three things you buy most often - that is usually enough for the first useful pattern to show up.',
    };
  }

  sentences.push(
    `In ${monthLabel} you took in ${money(totals.income)} and spent ${money(totals.expense)}, leaving ${money(totals.balance)}.`
  );

  if (topCategory) {
    sentences.push(`${topCategory.name} was your largest category at ${money(topCategory.total)}, about ${topCategory.share}% of everything you spent.`);
  }

  const risen = highlights.find((h) => h.direction === 'up');
  if (risen) {
    sentences.push(
      `${risen.categoryName} rose ${Math.round(Math.abs(risen.changePct))}% against your recent average, from about ${money(risen.previousAmount)} to ${money(risen.amount)}.`
    );
  }

  const fallen = highlights.find((h) => h.direction === 'down');
  if (fallen && !risen) {
    sentences.push(
      `${fallen.categoryName} came down ${Math.round(Math.abs(fallen.changePct))}% against your recent average - worth keeping.`
    );
  }

  // The advice is tied to whatever the summary just flagged.
  let tipText;
  if (risen) {
    const weeklyCap = money((risen.previousAmount / 4) * 1.05);
    tipText = `Try a weekly cap of about ${weeklyCap} on ${risen.categoryName} next month. That puts it back near the level you were already comfortable with rather than asking you to cut it out.`;
  } else if (totals.expense > totals.income) {
    tipText = `You spent ${money(totals.expense - totals.income)} more than you received. Pick the one category you would miss least and set a budget on it - a cap you can see is much easier to hold than a resolution.`;
  } else if (facts.savingsGoal && totals.balance < facts.savingsGoal) {
    tipText = `You are ${money(facts.savingsGoal - totals.balance)} short of your savings goal. Setting a budget on ${topCategory?.name || 'your biggest category'} is usually the fastest way to close a gap that size.`;
  } else if (totals.savingsRate !== null && totals.savingsRate >= 20) {
    tipText = `You kept ${totals.savingsRate}% of what came in this month, which is a strong month by any standard. Moving that amount out of your spending account is how it stays saved.`;
  } else {
    tipText = `Set a budget on ${topCategory?.name || 'your largest category'} for next month. Watching one number is far easier than watching all of them.`;
  }

  return { summaryText: sentences.join(' '), tipText };
}

/**
 * Builds (or rebuilds) the insight for one month and stores it so the student
 * can reopen it later.
 */
export async function generateInsight(user, month, { useLlm = true } = {}) {
  const start = startOfMonth(month);
  const facts = await gatherFacts(user, start);
  const written = writeSummary(facts, user.currency || 'PKR');

  let engine = 'statistical';
  let summaryText = written.summaryText;

  if (useLlm && llmEnabled() && facts.totals.transactionCount > 0) {
    const narrated = await narrateInsight({
      facts: {
        month: facts.monthLabel,
        income: facts.totals.income,
        expense: facts.totals.expense,
        kept: facts.totals.balance,
        savingsRatePercent: facts.totals.savingsRate,
        largestCategory: facts.topCategory ? { name: facts.topCategory.name, amount: facts.topCategory.total, sharePercent: facts.topCategory.share } : null,
        notableChanges: facts.highlights,
        savingsGoal: facts.savingsGoal || null,
      },
      currency: user.currency,
    });
    if (narrated) {
      summaryText = narrated;
      engine = 'llm';
    }
  }

  const insight = await Insight.findOneAndUpdate(
    { user: user._id, month: start },
    {
      $set: {
        summaryText,
        tipText: written.tipText,
        highlights: facts.highlights,
        stats: {
          income: facts.totals.income,
          expense: facts.totals.expense,
          balance: facts.totals.balance,
          savingsRate: facts.totals.savingsRate,
          topCategory: facts.topCategory?.name || '',
          transactionCount: facts.totals.transactionCount,
        },
        engine,
        generatedAt: new Date(),
      },
      $setOnInsert: { user: user._id, month: start },
    },
    { new: true, upsert: true }
  );

  return insight;
}

/* ---------------------------------------------------------------------------
   The details beside the summary: worked out live on every view (they are
   cheap), so they always match the transactions as they are now.
--------------------------------------------------------------------------- */

// What counts as a small purchase, in the student's currency units.
const SMALL = 500;

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * A 0-100 score for the month, from three things a student controls, each
 * explained on the page so it is never a mystery number:
 *   - how much of the income was kept         (up to 50)
 *   - how many budgets stayed under their cap (up to 30; 15 with none set)
 *   - spending against their own usual month  (up to 20)
 */
function monthScore({ totals, budgets, usualExpense }) {
  const parts = [];
  const rate = totals.savingsRate;
  const keep = rate === null ? 0 : Math.round(Math.max(0, Math.min(1, rate / 30)) * 50);
  parts.push({ label: 'Money kept', points: keep, max: 50, note: rate === null ? 'Nothing came in yet' : rate < 0 ? `Spent ${-rate}% more than came in` : `${rate}% of income kept (30% earns full marks)` });

  let budgetPts = 15;
  let budgetNote = 'No budgets set - half marks';
  if (budgets.length) {
    const held = budgets.filter((b) => b.state !== 'exceeded').length;
    budgetPts = Math.round((held / budgets.length) * 30);
    budgetNote = `${held} of ${budgets.length} budgets held`;
  }
  parts.push({ label: 'Budgets', points: budgetPts, max: 30, note: budgetNote });

  let paceNote = 'Not enough history yet - half marks';
  let pace = 10;
  if (usualExpense > 0) {
    const ratio = totals.expense / usualExpense;
    pace = Math.round(Math.max(0, Math.min(1, (1.3 - ratio) / 0.5)) * 20);
    paceNote = `Spending ${ratio <= 1 ? `${Math.round((1 - ratio) * 100)}% below` : `${Math.round((ratio - 1) * 100)}% above`} your usual month`;
  }
  parts.push({ label: 'Pace', points: pace, max: 20, note: paceNote });

  const score = parts.reduce((acc, p) => acc + p.points, 0);
  const word = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs work';
  return { score, word, parts };
}

export async function monthDetails(user, month) {
  const start = startOfMonth(month);
  const [totals, spending, baseline, sixMonths, daily, budgets, biggest, small] = await Promise.all([
    monthTotals(user._id, start),
    byCategory(user._id, start, 'expense'),
    categoryBaseline(user._id, start, 3),
    trend(user._id, start, 6),
    dailySeries(user._id, start),
    budgetProgress(Budget, user._id, start),
    Transaction.findOne({ user: user._id, month: start, type: 'expense' }).sort({ amount: -1 }).populate('category', 'name icon slot'),
    // Small purchases add up without being noticed; this counts them.
    Transaction.aggregate([
      { $match: { user: user._id, month: start, type: 'expense', amount: { $lt: SMALL } } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } },
    ]),
  ]);

  // Every category against the student's own average of the months before.
  const categories = spending.map((row) => {
    const base = baseline.get(String(row.categoryId));
    const usual = base && base.monthsSeen >= 1 ? base.average : null;
    return {
      name: row.name,
      icon: row.icon,
      slot: row.slot,
      amount: row.total,
      count: row.count,
      share: row.share,
      usual,
      changePct: usual ? Math.round(((row.total - usual) / usual) * 100) : null,
    };
  });

  // The usual month: the average spending of the earlier months that had any.
  const earlier = sixMonths.slice(0, -1).filter((m) => m.expense > 0);
  const usualExpense = earlier.length ? round2(earlier.reduce((a, m) => a + m.expense, 0) / earlier.length) : 0;

  // Habits: which weekday costs the most, and how much goes at weekends.
  const byWeekday = WEEKDAYS.map((name) => ({ name, total: 0, days: 0 }));
  for (const d of daily) {
    const w = new Date(`${d.date}T00:00:00Z`).getUTCDay();
    byWeekday[w].total += d.total;
    byWeekday[w].days += 1;
  }
  const weekdays = byWeekday.map((w) => ({ name: w.name.slice(0, 3), full: w.name, average: w.days ? round2(w.total / w.days) : 0 }));
  const topDay = [...weekdays].sort((a, b) => b.average - a.average)[0];
  const weekendTotal = byWeekday[0].total + byWeekday[6].total;
  const spentDays = daily.filter((d) => d.total > 0);

  return {
    score: monthScore({ totals, budgets, usualExpense }),
    totals,
    usualExpense,
    previous: sixMonths.length > 1 ? sixMonths[sixMonths.length - 2] : null,
    sixMonths,
    categories,
    weekdays: [...weekdays.slice(1), weekdays[0]], // Monday first
    habits: {
      topDay: topDay && topDay.average > 0 ? topDay : null,
      weekendShare: totals.expense ? Math.round((weekendTotal / totals.expense) * 100) : 0,
      activeDays: spentDays.length,
      daysInMonth: daily.length,
      perActiveDay: spentDays.length ? round2(totals.expense / spentDays.length) : 0,
      small: { under: SMALL, count: small[0]?.count || 0, total: round2(small[0]?.total || 0) },
    },
    biggest: biggest
      ? { description: biggest.description || biggest.category?.name, amount: biggest.amount, date: biggest.date, category: biggest.category }
      : null,
    budgets: budgets.map((b) => ({ name: b.category.name, icon: b.category.icon, slot: b.category.slot, spent: b.spent, limit: b.limitAmount, pct: b.pct, state: b.state })),
  };
}
