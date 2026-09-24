import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import { monthTotals, byCategory, categoryBaseline, budgetProgress, trend } from './analytics.js';
import { forecastNextMonth } from './forecast.js';
import { listTips } from './tips.js';
import { suggestCategory, visibleCategories, tokenize } from './categorizer.js';
import { answerQuestion, llmEnabled } from './llm.js';
import { addMonths, endOfMonth, startOfMonth } from '../utils/dates.js';
import { formatMoney, pctChange, round2 } from '../utils/money.js';

// ---------------------------------------------------------------------------
// The chat assistant
//
// A student types a question in their own words; this works out which of a
// small set of questions it is (an "intent"), fetches the numbers from the same
// analytics the reports use, and answers in a sentence. It is a rule-based
// router, not a language model - so every figure it quotes is one the reports
// page would show too, and it works with no API key at all.
//
// Only when no rule matches, and only if ANTHROPIC_API_KEY is set, is the
// question passed to Claude - together with a snapshot of facts this file has
// already calculated, and an instruction to use nothing else.
// ---------------------------------------------------------------------------

/** The follow-up questions offered as buttons under an answer. */
const STARTERS = ['How am I doing this month?', 'Where does my money go?', 'Any saving tips?', 'Am I within budget?'];

const has = (text, ...patterns) => patterns.some((p) => p.test(text));

/** Reads "last month" / "previous month" as the month before; anything else is this month. */
function monthFor(text) {
  const now = startOfMonth();
  return has(text, /\blast month\b/, /\bprevious month\b/) ? addMonths(now, -1) : now;
}

const monthName = (date) => date.toLocaleString('en', { month: 'long', timeZone: 'UTC' });

/** The first amount written in the question: "2,500", "Rs 800", "1.5k". */
function amountIn(text) {
  const match = /(\d[\d,]*(?:\.\d+)?)\s*(k\b)?/.exec(text);
  if (!match) return null;
  const value = Number(match[1].replace(/,/g, '')) * (match[2] ? 1000 : 1);
  return value > 0 ? value : null;
}

/**
 * Finds the category a question is about. Matches the category's own name
 * ("food", or either half of "Hostel/Rent") before its seed keywords
 * ("canteen" -> Food), so an explicit name always wins.
 */
async function categoryIn(userId, text) {
  const words = new Set(tokenize(text));
  if (!words.size) return null;
  const categories = await visibleCategories(userId);

  const byName = categories.find((c) =>
    c.name
      .toLowerCase()
      .split(/[^a-z]+/)
      .some((part) => part.length > 2 && (words.has(part) || words.has(`${part}s`)))
  );
  if (byName) return byName;
  return categories.find((c) => c.keywords.some((k) => words.has(k))) || null;
}

/* ---------------------------------------------------------------------------
   Answers. Each takes the context and returns { reply, rows?, link?, chips? }.
--------------------------------------------------------------------------- */

async function summary({ user, month, money }) {
  const totals = await monthTotals(user._id, month);
  if (!totals.transactionCount) {
    return {
      reply: `Nothing is logged for ${monthName(month)} yet. Add your first income or expense and I can start keeping score.`,
      link: { to: '/transactions', label: 'Log a transaction' },
    };
  }

  const verdict =
    totals.balance >= 0
      ? `You have kept ${money(totals.balance)}${totals.savingsRate !== null ? `, which is ${totals.savingsRate}% of what came in` : ''}.`
      : `You have spent ${money(-totals.balance)} more than came in, so the difference is coming out of savings.`;

  return {
    reply: `In ${monthName(month)} ${money(totals.income)} came in and ${money(totals.expense)} went out. ${verdict}`,
    rows: [
      { label: 'Money in', value: money(totals.income), tone: 'in' },
      { label: 'Money out', value: money(totals.expense), tone: 'out' },
      { label: 'Kept', value: money(totals.balance), tone: totals.balance < 0 ? 'bad' : 'good' },
    ],
    link: { to: '/reports', label: 'Open the full report' },
  };
}

async function topCategories({ user, month, money }) {
  const rows = await byCategory(user._id, month, 'expense');
  if (!rows.length) return { reply: `There is no spending logged for ${monthName(month)} yet.` };

  const [top] = rows;
  return {
    reply: `${top.name} is your biggest expense in ${monthName(month)}: ${money(top.total)}, or ${top.share}% of everything you spent.`,
    rows: rows.slice(0, 5).map((row) => ({ label: row.name, value: `${money(row.total)} · ${row.share}%`, slot: row.slot })),
    link: { to: '/reports', label: 'See every category' },
  };
}

async function oneCategory({ user, month, money }, category) {
  if (category.type === 'income') {
    const rows = await byCategory(user._id, month, 'income');
    const row = rows.find((r) => String(r.categoryId) === String(category._id));
    return {
      reply: row
        ? `${money(row.total)} came in as ${category.name} in ${monthName(month)}, across ${row.count} ${row.count === 1 ? 'entry' : 'entries'}.`
        : `Nothing has come in as ${category.name} in ${monthName(month)}.`,
    };
  }

  const [rows, baseline, budgets] = await Promise.all([
    byCategory(user._id, month, 'expense'),
    categoryBaseline(user._id, month),
    budgetProgress(Budget, user._id, month),
  ]);
  const row = rows.find((r) => String(r.categoryId) === String(category._id));
  const spent = row?.total || 0;
  const usual = baseline.get(String(category._id))?.average;
  const budget = budgets.find((b) => String(b.category._id) === String(category._id));

  const parts = [`You have spent ${money(spent)} on ${category.name} in ${monthName(month)}.`];
  if (usual) {
    const change = pctChange(usual, spent);
    parts.push(
      Math.abs(change) < 5
        ? `That is about your usual ${money(usual)}.`
        : `Your usual month is ${money(usual)}, so this is ${Math.abs(Math.round(change))}% ${change > 0 ? 'more' : 'less'}.`
    );
  }
  if (budget) {
    parts.push(
      budget.remaining >= 0
        ? `${money(budget.remaining)} of the ${money(budget.limitAmount)} budget is left.`
        : `That is ${money(-budget.remaining)} over its ${money(budget.limitAmount)} budget.`
    );
  }
  return { reply: parts.join(' '), link: { to: `/transactions`, label: `See ${category.name} entries` } };
}

async function budgets({ user, month, money }) {
  const rows = await budgetProgress(Budget, user._id, month);
  if (!rows.length) {
    return {
      reply: 'You have not set any budgets for this month. A cap on your two biggest categories is a good place to start.',
      link: { to: '/budgets', label: 'Set a budget' },
    };
  }

  const over = rows.filter((r) => r.state === 'exceeded');
  const close = rows.filter((r) => r.state === 'warning');
  const reply = over.length
    ? `${over.map((r) => r.category.name).join(' and ')} ${over.length === 1 ? 'is' : 'are'} over budget.${close.length ? ` ${close.map((r) => r.category.name).join(' and ')} ${close.length === 1 ? 'is' : 'are'} close.` : ''}`
    : close.length
      ? `Nothing is over yet, but ${close.map((r) => r.category.name).join(' and ')} ${close.length === 1 ? 'is' : 'are'} past 80%.`
      : `All ${rows.length} budgets are comfortably within their limits.`;

  return {
    reply,
    rows: rows.map((r) => ({
      label: r.category.name,
      value: `${money(r.spent)} of ${money(r.limitAmount)} · ${r.pct}%`,
      tone: r.state === 'exceeded' ? 'bad' : r.state === 'warning' ? 'warn' : 'good',
    })),
    link: { to: '/budgets', label: 'Manage budgets' },
  };
}

async function forecast({ user, money }) {
  const result = await forecastNextMonth(user._id, startOfMonth());
  if (!result.available) return { reply: result.reason };

  return {
    reply:
      `Going by your last ${result.monthsUsed} months, next month looks like about ${money(result.expense)} out and ${money(result.income)} in. ` +
      `It is a straight line through your history, and a ${result.reliability} one: real months have landed about ${money(result.margin)} away from it.`,
    link: { to: '/insights', label: 'See the forecast' },
  };
}

async function biggestExpense({ user, month, money }) {
  const row = await Transaction.findOne({ user: user._id, type: 'expense', month })
    .sort({ amount: -1 })
    .populate('category', 'name');
  if (!row) return { reply: `There is no spending logged for ${monthName(month)} yet.` };

  const day = row.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  return {
    reply: `Your largest single expense in ${monthName(month)} was ${money(row.amount)} for "${row.description || row.category?.name}" (${row.category?.name}) on ${day}.`,
  };
}

async function tips({ user, money }) {
  const list = (await listTips(user._id)).filter((tip) => tip.impact > 0).slice(0, 3);
  if (!list.length) {
    return {
      reply: 'Nothing stands out right now. Your spending is in line with your own averages. Keep logging and I will say when that changes.',
    };
  }
  return {
    reply: `${list[0].title}. ${list[0].body}`,
    rows: list.slice(1).map((tip) => ({ label: tip.title, value: `up to ${money(tip.impact)}/month`, tone: 'good' })),
    link: { to: '/tips', label: 'All saving tips' },
  };
}

async function afford({ user, money }, text) {
  const amount = amountIn(text);
  const now = startOfMonth();
  const totals = await monthTotals(user._id, now);
  if (!amount) {
    return { reply: `Tell me the price, for example "Can I afford ${money(2500)}?", and I will check it against this month.` };
  }

  const today = new Date();
  const daysLeft = endOfMonth(now).getUTCDate() - today.getUTCDate() + 1;
  const after = round2(totals.balance - amount);
  const perDay = after > 0 ? after / daysLeft : 0;

  let reply;
  if (totals.balance <= 0) {
    reply = `Not from this month's money. You have already spent ${money(-totals.balance)} more than came in, so ${money(amount)} would widen that gap to ${money(-after)}.`;
  } else if (after < 0) {
    reply = `Not comfortably. You have ${money(totals.balance)} left from this month's income, so ${money(amount)} would put you ${money(-after)} into savings.`;
  } else {
    reply = `Yes. You would still have ${money(after)} left for the ${daysLeft} days remaining, about ${money(perDay)} a day.`;
  }
  return { reply: `${reply} This is a check against your own logged numbers, not financial advice.` };
}

async function whichCategory({ user }, text) {
  // Whatever follows "is", "for" or the colon is the description being asked about.
  const description = text.replace(/^.*?(categor\w*|file|put)\b[^a-z0-9]*(is|for|of|under)?\s*/i, '').replace(/[?"']/g, '');
  const guess = await suggestCategory({ userId: user._id, description, type: 'expense' });
  if (!guess) {
    return {
      reply: `I cannot place "${description.trim()}" yet. Pick a category when you log it and I will remember next time.`,
    };
  }
  const alternatives = guess.alternatives?.length
    ? ` It could also be ${guess.alternatives.map((a) => a.name).join(' or ')}.`
    : '';
  return {
    reply: `I would file "${description.trim()}" under ${guess.category.name}. I am ${Math.round(guess.confidence * 100)}% sure, based on ${guess.reason}.${alternatives}`,
  };
}

async function compare({ user, money }) {
  const now = startOfMonth();
  const [current, previous] = await Promise.all([monthTotals(user._id, now), monthTotals(user._id, addMonths(now, -1))]);
  if (!previous.transactionCount) return { reply: 'There is nothing logged for last month to compare against.' };

  const change = pctChange(previous.expense, current.expense);
  return {
    reply:
      change === null
        ? `You spent ${money(current.expense)} this month.`
        : `You have spent ${money(current.expense)} this month against ${money(previous.expense)} last month, ${Math.abs(Math.round(change))}% ${change >= 0 ? 'more' : 'less'} so far.`,
    rows: [
      { label: monthName(addMonths(now, -1)), value: money(previous.expense), tone: 'out' },
      { label: monthName(now), value: money(current.expense), tone: 'out' },
    ],
  };
}

function help() {
  return {
    reply:
      'I answer from your own transactions. Ask about your balance, a category ("how much on food?"), your budgets, ' +
      'your biggest expense, next month, whether you can afford something, or which category a purchase belongs in.',
  };
}

/* ---------------------------------------------------------------------------
   Routing
--------------------------------------------------------------------------- */

/** A compact set of facts for Claude to answer from when no rule matched. */
async function factSheet(user, month) {
  const [totals, categories, history, budgetRows] = await Promise.all([
    monthTotals(user._id, month),
    byCategory(user._id, month, 'expense'),
    trend(user._id, month, 6),
    budgetProgress(Budget, user._id, month),
  ]);
  return {
    month: month.toISOString().slice(0, 7),
    totals,
    spendingByCategory: categories.map(({ name, total, share }) => ({ name, total, share })),
    lastSixMonths: history.map(({ month: m, income, expense }) => ({ month: m, income, expense })),
    budgets: budgetRows.map((b) => ({ category: b.category.name, limit: b.limitAmount, spent: b.spent, pct: b.pct })),
    savingsGoal: user.savingsGoal,
  };
}

export async function answer(user, question) {
  const text = String(question || '').toLowerCase().trim();
  const context = { user, month: monthFor(text), money: (n) => formatMoney(n, user.currency) };

  // Order matters: the most specific questions are checked first, so "how much
  // on food last month" reaches the category answer rather than the summary.
  let result;
  if (!text) result = help();
  else if (has(text, /categor(y|ise|ize)|which .*(file|put)/) && !has(text, /top|biggest|most/)) result = await whichCategory(context, text);
  else if (has(text, /afford/)) result = await afford(context, text);
  else if (has(text, /forecast|next month|predict|expect/)) result = await forecast(context);
  else if (has(text, /budget|limit|\bcap\b|overspen/)) result = await budgets(context);
  else if (has(text, /tip|save more|saving|advice|cut (down|back)|reduce/)) result = await tips(context);
  else if (has(text, /biggest (expense|purchase|transaction)|largest|most expensive/)) result = await biggestExpense(context);
  else if (has(text, /compare|than last month|vs\.? last|versus/)) result = await compare(context);
  // Before the category lookup: "money" is a seed keyword of Allowance, so
  // "where does my money go" would otherwise be read as a question about income.
  else if (has(text, /where .*money|top categor|most on|spend(ing)? the most|breakdown/)) result = await topCategories(context);
  else {
    const category = await categoryIn(user._id, text);
    if (category) result = await oneCategory(context, category);
    else if (has(text, /balance|left|kept|how am i|how('?s| is) (it|my)|summary|this month|overview|income|spent|spend/)) result = await summary(context);
    else if (has(text, /^(hi|hey|hello|salam|assalam|aoa)\b/)) result = { reply: `Hi ${user.name.split(' ')[0]}! Ask me anything about your money this month.` };
    else if (has(text, /help|what can you|how do(es)? (you|this) work/)) result = help();
  }

  if (result) return { ...result, source: 'engine', chips: STARTERS };

  // No rule understood the question. Claude may answer it, but only from facts
  // calculated above, so it can phrase an answer but never invent a figure.
  if (llmEnabled()) {
    const reply = await answerQuestion({ question, facts: await factSheet(user, context.month), currency: user.currency });
    if (reply) return { reply, source: 'claude', chips: STARTERS };
  }

  return {
    reply: "I didn't catch that one. I can only answer questions about your own spending and income. Try one of these:",
    source: 'engine',
    chips: STARTERS,
  };
}

/** What the assistant opens with: a greeting and the single most valuable tip. */
export async function opening(user) {
  const [top] = (await listTips(user._id)).filter((tip) => tip.impact > 0);
  const money = (n) => formatMoney(n, user.currency);
  return {
    greeting: `Hi ${user.name.split(' ')[0]}! I can answer questions about your own spending. Everything I say comes from what you have logged.`,
    tip: top ? { title: top.title, body: top.body, impact: money(top.impact) } : null,
    chips: STARTERS,
  };
}
