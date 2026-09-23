import Insight from '../models/Insight.js';
import { byCategory, categoryBaseline, monthTotals, trend } from './analytics.js';
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
