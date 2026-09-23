import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import { addMonths, monthRange, startOfMonth, endOfMonth, weekOfMonth } from '../utils/dates.js';
import { round2 } from '../utils/money.js';

// Shared aggregations. The reports page, the tips engine, the insight writer and
// the forecast all read their numbers from here so they can never disagree.

const oid = (id) => new mongoose.Types.ObjectId(String(id));

/** Income, expense and the balance between them for one month. */
export async function monthTotals(userId, month) {
  const rows = await Transaction.aggregate([
    { $match: { user: oid(userId), month: startOfMonth(month) } },
    { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  const income = rows.find((r) => r._id === 'income')?.total || 0;
  const expense = rows.find((r) => r._id === 'expense')?.total || 0;
  return {
    income: round2(income),
    expense: round2(expense),
    balance: round2(income - expense),
    // Share of income the student did not spend. Null when nothing came in.
    savingsRate: income > 0 ? Math.round(((income - expense) / income) * 100) : null,
    transactionCount: rows.reduce((acc, r) => acc + r.count, 0),
  };
}

/** Spending (or income) split by category for one month, largest first. */
export async function byCategory(userId, month, type = 'expense') {
  const rows = await Transaction.aggregate([
    { $match: { user: oid(userId), month: startOfMonth(month), type } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    {
      $project: {
        _id: 0,
        categoryId: '$_id',
        name: '$category.name',
        slot: '$category.slot',
        icon: '$category.icon',
        total: { $round: ['$total', 2] },
        count: 1,
      },
    },
    { $sort: { total: -1 } },
  ]);
  const grand = rows.reduce((acc, r) => acc + r.total, 0);
  return rows.map((row) => ({ ...row, share: grand ? Math.round((row.total / grand) * 100) : 0 }));
}

/** Income vs expense for the last `count` months, oldest first. */
export async function trend(userId, endMonthDate, count = 6) {
  const months = monthRange(endMonthDate, count);
  const rows = await Transaction.aggregate([
    {
      $match: {
        user: oid(userId),
        month: { $gte: months[0], $lte: months[months.length - 1] },
      },
    },
    { $group: { _id: { month: '$month', type: '$type' }, total: { $sum: '$amount' } } },
  ]);

  return months.map((month) => {
    const stamp = month.getTime();
    const pick = (type) =>
      round2(rows.find((r) => r._id.month.getTime() === stamp && r._id.type === type)?.total || 0);
    const income = pick('income');
    const expense = pick('expense');
    return {
      month: `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, '0')}`,
      label: month.toLocaleString('en', { month: 'short', timeZone: 'UTC' }),
      income,
      expense,
      balance: round2(income - expense),
    };
  });
}

/** Day-by-day spending across one month, including the days with nothing on them. */
export async function dailySeries(userId, month) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const rows = await Transaction.aggregate([
    { $match: { user: oid(userId), type: 'expense', date: { $gte: start, $lte: end } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: 'UTC' } }, total: { $sum: '$amount' } } },
  ]);
  const totals = new Map(rows.map((r) => [r._id, round2(r.total)]));
  const days = end.getUTCDate();

  return Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), i + 1));
    const key = date.toISOString().slice(0, 10);
    return { date: key, day: i + 1, total: totals.get(key) || 0 };
  });
}

/** The same month rolled up into weeks, for the weekly summary card. */
export async function weeklySeries(userId, month) {
  const days = await dailySeries(userId, month);
  const weeks = new Map();

  for (const day of days) {
    const date = new Date(`${day.date}T00:00:00Z`);
    const week = weekOfMonth(date);
    const entry = weeks.get(week) || { week, total: 0, from: day.date, to: day.date };
    entry.total = round2(entry.total + day.total);
    entry.to = day.date;
    weeks.set(week, entry);
  }
  return [...weeks.values()].sort((a, b) => a.week - b.week);
}

/**
 * Average monthly spend per category over the `months` months *before* the given
 * month. This is the baseline everything else compares against - it is what makes
 * the advice personal rather than generic.
 */
export async function categoryBaseline(userId, month, months = 3) {
  const current = startOfMonth(month);
  const from = addMonths(current, -months);
  const to = addMonths(current, -1);

  const rows = await Transaction.aggregate([
    { $match: { user: oid(userId), type: 'expense', month: { $gte: from, $lte: to } } },
    { $group: { _id: { category: '$category', month: '$month' }, total: { $sum: '$amount' } } },
    { $group: { _id: '$_id.category', average: { $avg: '$total' }, monthsSeen: { $sum: 1 } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    {
      $project: {
        _id: 0,
        categoryId: '$_id',
        name: '$category.name',
        average: { $round: ['$average', 2] },
        monthsSeen: 1,
      },
    },
  ]);

  return new Map(rows.map((row) => [String(row.categoryId), row]));
}

/** Budget caps for a month next to what was actually spent against each. */
export async function budgetProgress(Budget, userId, month) {
  const start = startOfMonth(month);
  const [budgets, spending] = await Promise.all([
    Budget.find({ user: userId, month: start }).populate('category', 'name slot icon type'),
    byCategory(userId, start, 'expense'),
  ]);
  const spent = new Map(spending.map((row) => [String(row.categoryId), row.total]));

  return budgets
    .filter((budget) => budget.category)
    .map((budget) => {
      const used = spent.get(String(budget.category._id)) || 0;
      const pct = budget.limitAmount > 0 ? Math.round((used / budget.limitAmount) * 100) : 0;
      return {
        _id: budget._id,
        category: budget.category,
        limitAmount: round2(budget.limitAmount),
        spent: used,
        remaining: round2(budget.limitAmount - used),
        pct,
        state: pct >= 100 ? 'exceeded' : pct >= 80 ? 'warning' : 'ok',
      };
    })
    .sort((a, b) => b.pct - a.pct);
}
