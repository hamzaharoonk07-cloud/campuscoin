import express from 'express';
import Budget from '../models/Budget.js';
import Category from '../models/Category.js';
import { protect, wrap } from '../middleware/auth.js';
import { budgetProgress } from '../services/analytics.js';
import { parseMonth, addMonths } from '../utils/dates.js';
import { round2 } from '../utils/money.js';

const router = express.Router();
router.use(protect);

/** Every budget for a month with live progress against it. */
router.get(
  '/',
  wrap(async (req, res) => {
    const month = parseMonth(req.query.month);
    const budgets = await budgetProgress(Budget, req.user._id, month);

    const totalLimit = round2(budgets.reduce((acc, b) => acc + b.limitAmount, 0));
    const totalSpent = round2(budgets.reduce((acc, b) => acc + b.spent, 0));

    res.json({
      budgets,
      summary: {
        totalLimit,
        totalSpent,
        totalRemaining: round2(totalLimit - totalSpent),
        pct: totalLimit ? Math.round((totalSpent / totalLimit) * 100) : 0,
        overCount: budgets.filter((b) => b.state === 'exceeded').length,
      },
    });
  })
);

/** Creates or updates the cap for one category in one month. */
router.put(
  '/',
  wrap(async (req, res) => {
    const { categoryId, month, limitAmount } = req.body;
    const when = parseMonth(month);
    const amount = Number(limitAmount);

    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ message: 'Enter a budget of zero or more' });
    }

    const category = await Category.findOne({
      _id: categoryId,
      type: 'expense',
      $or: [{ owner: req.user._id }, { owner: null }],
    });
    if (!category) return res.status(400).json({ message: 'Budgets can only be set on your expense categories' });

    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, category: category._id, month: when },
      // alertedAt resets so a raised budget can warn again at its new level.
      { $set: { limitAmount: amount, alertedAt: 0 }, $setOnInsert: { user: req.user._id, category: category._id, month: when } },
      { new: true, upsert: true }
    ).populate('category', 'name slot icon');

    res.json({ budget });
  })
);

router.delete(
  '/:id',
  wrap(async (req, res) => {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!budget) return res.status(404).json({ message: 'That budget was not found' });
    res.json({ message: 'Budget removed' });
  })
);

/** Copies a month's caps forward, so a student sets them properly once. */
router.post(
  '/copy-forward',
  wrap(async (req, res) => {
    const from = parseMonth(req.body.from);
    const to = req.body.to ? parseMonth(req.body.to) : addMonths(from, 1);

    const source = await Budget.find({ user: req.user._id, month: from });
    if (!source.length) return res.status(400).json({ message: 'That month has no budgets to copy' });

    await Budget.bulkWrite(
      source.map((budget) => ({
        updateOne: {
          filter: { user: req.user._id, category: budget.category, month: to },
          update: {
            $set: { limitAmount: budget.limitAmount, alertedAt: 0 },
            $setOnInsert: { user: req.user._id, category: budget.category, month: to },
          },
          upsert: true,
        },
      }))
    );

    res.json({ copied: source.length });
  })
);

export default router;
