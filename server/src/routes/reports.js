import express from 'express';
import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import Announcement from '../models/Announcement.js';
import Insight from '../models/Insight.js';
import { protect, wrap } from '../middleware/auth.js';
import {
  byCategory,
  budgetProgress,
  dailySeries,
  monthTotals,
  trend,
  weeklySeries,
} from '../services/analytics.js';
import { forecastNextMonth } from '../services/forecast.js';
import { listTips, refreshTips } from '../services/tips.js';
import { runRecurring } from '../services/recurring.js';
import { parseMonth, monthKey } from '../utils/dates.js';
import { round2 } from '../utils/money.js';

const router = express.Router();
router.use(protect);

/**
 * Everything the dashboard needs, in one request. Fetching it as a single call
 * keeps the first paint fast and means the numbers on the page are all from the
 * same instant.
 */
router.get(
  '/dashboard',
  wrap(async (req, res) => {
    const month = parseMonth(req.query.month);

    // Due recurring entries are written before the totals are read, so the
    // dashboard never shows a month that is missing this month's allowance.
    await runRecurring(req.user._id);

    const [totals, spending, incomeSources, budgets, sixMonths, tips, announcements, insight, recent] = await Promise.all([
      monthTotals(req.user._id, month),
      byCategory(req.user._id, month, 'expense'),
      // Where the money came from, for the dashboard's monthly rhythm card.
      byCategory(req.user._id, month, 'income'),
      budgetProgress(Budget, req.user._id, month),
      trend(req.user._id, month, 6),
      listTips(req.user._id),
      Announcement.find({ kind: 'announcement', active: true }).sort({ createdAt: -1 }).limit(3),
      Insight.findOne({ user: req.user._id, month: parseMonth(req.query.month) }),
      // Sorted by when the money moved, not when the row was written - with
      // imported or seeded data those two orders are completely different.
      Transaction.find({ user: req.user._id })
        .populate('category', 'name slot icon')
        .sort({ date: -1, createdAt: -1 })
        .limit(6),
    ]);

    res.json({
      month: monthKey(month),
      totals,
      topCategory: spending[0] || null,
      spending: spending.slice(0, 6),
      income: incomeSources.slice(0, 6),
      budgets: budgets.slice(0, 4),
      trend: sixMonths,
      tips: tips.slice(0, 3),
      announcements,
      insight,
      recent,
      goal: {
        target: req.user.savingsGoal || 0,
        kept: totals.balance,
        pct: req.user.savingsGoal ? Math.min(100, Math.round((totals.balance / req.user.savingsGoal) * 100)) : null,
      },
    });
  })
);

/** The full monthly report: category split, daily and weekly views, trend. */
router.get(
  '/monthly',
  wrap(async (req, res) => {
    const month = parseMonth(req.query.month);

    const [totals, expenses, income, daily, weekly, sixMonths, budgets] = await Promise.all([
      monthTotals(req.user._id, month),
      byCategory(req.user._id, month, 'expense'),
      byCategory(req.user._id, month, 'income'),
      dailySeries(req.user._id, month),
      weeklySeries(req.user._id, month),
      trend(req.user._id, month, 6),
      budgetProgress(Budget, req.user._id, month),
    ]);

    const spendingDays = daily.filter((d) => d.total > 0);

    res.json({
      month: monthKey(month),
      label: month.toLocaleString('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
      totals,
      expenses,
      income,
      daily,
      weekly,
      trend: sixMonths,
      budgets,
      pace: {
        // Average across the days money actually moved, which is more useful to
        // a student than an average that counts every quiet day as a zero.
        perActiveDay: spendingDays.length ? round2(totals.expense / spendingDays.length) : 0,
        activeDays: spendingDays.length,
        busiestDay: spendingDays.sort((a, b) => b.total - a.total)[0] || null,
      },
    });
  })
);

/** Income vs expense over the last six months (SRS 1.6, Monthly Reports). */
router.get(
  '/trend',
  wrap(async (req, res) => {
    const month = parseMonth(req.query.month);
    const months = Math.min(24, Math.max(3, Number(req.query.months) || 6));
    res.json({ trend: await trend(req.user._id, month, months) });
  })
);

/** Next month projected from the student's own history. */
router.get(
  '/forecast',
  wrap(async (req, res) => {
    res.json({ forecast: await forecastNextMonth(req.user._id, parseMonth(req.query.month)) });
  })
);

/**
 * A filtered report for the date-range / category / source filters. Returns the
 * matching rows plus their totals, which is what the export uses.
 */
router.get(
  '/filtered',
  wrap(async (req, res) => {
    const { from, to, category, type } = req.query;
    const filter = { user: req.user._id };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(`${String(to).slice(0, 10)}T23:59:59.999Z`);
    }

    const transactions = await Transaction.find(filter).populate('category', 'name slot icon').sort({ date: -1 }).limit(500);
    const income = round2(transactions.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0));
    const expense = round2(transactions.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0));

    res.json({ transactions, totals: { income, expense, balance: round2(income - expense), count: transactions.length } });
  })
);

/** Flagged transactions - unusually large amounts and likely duplicates. */
router.get(
  '/flagged',
  wrap(async (req, res) => {
    const transactions = await Transaction.find({ user: req.user._id, flags: { $ne: [] } })
      .populate('category', 'name slot icon')
      .sort({ date: -1 })
      .limit(20);
    res.json({ transactions });
  })
);

/** Rebuilds the tips feed on demand (the dashboard refresh button). */
router.post(
  '/refresh-tips',
  wrap(async (req, res) => {
    const tips = await refreshTips(req.user, parseMonth(req.body.month));
    res.json({ tips });
  })
);

export default router;
