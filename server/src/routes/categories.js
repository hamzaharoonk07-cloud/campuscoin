import express from 'express';
import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import { protect, wrap } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

/**
 * Everything the student can file against: the shared defaults plus their own.
 * `?type=expense` narrows it; `?mine=1` returns only their personal categories,
 * which is what the "Manage Own Categories" screen lists.
 */
router.get(
  '/',
  wrap(async (req, res) => {
    const filter = { archived: false };
    if (req.query.mine === '1') filter.owner = req.user._id;
    else filter.$or = [{ owner: req.user._id }, { owner: null }];
    if (req.query.type) filter.type = req.query.type;

    const categories = await Category.find(filter).sort({ isDefault: -1, name: 1 });

    // How much each one has been used, so the manage screen can warn before a delete.
    const usage = await Transaction.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const counts = new Map(usage.map((row) => [String(row._id), row.count]));

    res.json({
      categories: categories.map((category) => ({
        ...category.toObject(),
        transactionCount: counts.get(String(category._id)) || 0,
        editable: String(category.owner) === String(req.user._id),
      })),
    });
  })
);

router.post(
  '/',
  wrap(async (req, res) => {
    const { name, type, icon, slot, keywords } = req.body;
    if (!name || !type) return res.status(400).json({ message: 'A category needs a name and a type' });

    const clash = await Category.findOne({
      name: new RegExp(`^${String(name).trim()}$`, 'i'),
      type,
      $or: [{ owner: req.user._id }, { owner: null }],
      archived: false,
    });
    if (clash) return res.status(409).json({ message: `You already have a ${type} category called ${clash.name}` });

    const category = await Category.create({
      name: String(name).trim(),
      type,
      owner: req.user._id,
      isDefault: false,
      icon: icon || 'tag',
      slot: Number(slot) || 7,
      keywords: Array.isArray(keywords) ? keywords.map((k) => String(k).toLowerCase()) : [],
    });

    res.status(201).json({ category });
  })
);

router.patch(
  '/:id',
  wrap(async (req, res) => {
    const category = await Category.findOne({ _id: req.params.id, owner: req.user._id });
    if (!category) return res.status(404).json({ message: 'That category is not one you can edit' });

    for (const field of ['name', 'icon', 'slot']) {
      if (req.body[field] !== undefined) category[field] = req.body[field];
    }
    if (Array.isArray(req.body.keywords)) category.keywords = req.body.keywords.map((k) => String(k).toLowerCase());

    await category.save();
    res.json({ category });
  })
);

/**
 * Deleting a category that has history would orphan those transactions, so a
 * used category is archived instead - the reports for past months stay correct
 * and it simply stops appearing in the pickers.
 */
router.delete(
  '/:id',
  wrap(async (req, res) => {
    const category = await Category.findOne({ _id: req.params.id, owner: req.user._id });
    if (!category) return res.status(404).json({ message: 'That category is not one you can delete' });

    const used = await Transaction.countDocuments({ category: category._id });
    if (used > 0) {
      category.archived = true;
      await category.save();
      return res.json({
        archived: true,
        message: `${category.name} has ${used} transaction${used === 1 ? '' : 's'}, so it has been archived instead of deleted. Your past reports stay intact.`,
      });
    }

    await Budget.deleteMany({ category: category._id });
    await category.deleteOne();
    res.json({ archived: false, message: `${category.name} has been deleted` });
  })
);

router.post(
  '/:id/restore',
  wrap(async (req, res) => {
    const category = await Category.findOne({ _id: req.params.id, owner: req.user._id });
    if (!category) return res.status(404).json({ message: 'That category was not found' });
    category.archived = false;
    await category.save();
    res.json({ category });
  })
);

export default router;
