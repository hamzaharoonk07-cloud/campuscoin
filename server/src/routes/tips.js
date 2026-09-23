import express from 'express';
import Tip from '../models/Tip.js';
import Announcement from '../models/Announcement.js';
import { protect, wrap } from '../middleware/auth.js';
import { listTips, refreshTips } from '../services/tips.js';
import { parseMonth } from '../utils/dates.js';

const router = express.Router();
router.use(protect);

router.get(
  '/',
  wrap(async (req, res) => {
    const [tips, templates] = await Promise.all([
      listTips(req.user._id, { includeDismissed: req.query.all === '1' }),
      Announcement.find({ kind: 'tip-template', active: true }).sort({ createdAt: -1 }).limit(5),
    ]);
    res.json({ tips, templates });
  })
);

router.post(
  '/refresh',
  wrap(async (req, res) => {
    res.json({ tips: await refreshTips(req.user, parseMonth(req.body.month)) });
  })
);

/** Pin, dismiss or restore one tip. */
router.patch(
  '/:id',
  wrap(async (req, res) => {
    const { status } = req.body;
    if (!['active', 'pinned', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'A tip can be active, pinned or dismissed' });
    }

    const tip = await Tip.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { status } },
      { new: true }
    );
    if (!tip) return res.status(404).json({ message: 'That tip was not found' });
    res.json({ tip });
  })
);

export default router;
