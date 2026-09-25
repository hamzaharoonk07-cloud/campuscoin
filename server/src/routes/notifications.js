import express from 'express';
import Notification from '../models/Notification.js';
import { protect, wrap } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get(
  '/',
  wrap(async (req, res) => {
    const [notifications, unread] = await Promise.all([
      Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30),
      Notification.countDocuments({ user: req.user._id, read: false }),
    ]);
    res.json({ notifications, unread });
  })
);

router.post(
  '/read',
  wrap(async (req, res) => {
    const filter = { user: req.user._id, read: false };
    if (Array.isArray(req.body.ids) && req.body.ids.length) filter._id = { $in: req.body.ids };

    const result = await Notification.updateMany(filter, { $set: { read: true } });
    res.json({ updated: result.modifiedCount });
  })
);

/** Clears every notification (the "Clear all" link). */
router.delete(
  '/',
  wrap(async (req, res) => {
    const result = await Notification.deleteMany({ user: req.user._id });
    res.json({ cleared: result.deletedCount });
  })
);

router.delete(
  '/:id',
  wrap(async (req, res) => {
    await Notification.deleteOne({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Notification cleared' });
  })
);

export default router;
