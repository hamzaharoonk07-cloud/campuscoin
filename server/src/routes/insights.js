import express from 'express';
import Insight from '../models/Insight.js';
import { protect, wrap } from '../middleware/auth.js';
import { generateInsight } from '../services/insights.js';
import { llmEnabled } from '../services/llm.js';
import { sendMail } from '../services/mailer.js';
import { parseMonth, monthKey } from '../utils/dates.js';

const router = express.Router();
router.use(protect);

/** Insight history, newest first - past months stay readable. */
router.get(
  '/',
  wrap(async (req, res) => {
    const insights = await Insight.find({ user: req.user._id }).sort({ month: -1 }).limit(24);
    res.json({ insights, aiEnabled: llmEnabled() });
  })
);

/** One month. Generates it on first view so the page is never empty. */
router.get(
  '/:month',
  wrap(async (req, res) => {
    const month = parseMonth(req.params.month);
    let insight = await Insight.findOne({ user: req.user._id, month });
    if (!insight) insight = await generateInsight(req.user, month);
    res.json({ insight, aiEnabled: llmEnabled() });
  })
);

/** Regenerates a month against the current data. */
router.post(
  '/:month/generate',
  wrap(async (req, res) => {
    const insight = await generateInsight(req.user, parseMonth(req.params.month), {
      useLlm: req.body.useLlm !== false,
    });
    res.json({ insight, aiEnabled: llmEnabled() });
  })
);

router.post(
  '/:month/bookmark',
  wrap(async (req, res) => {
    const insight = await Insight.findOne({ user: req.user._id, month: parseMonth(req.params.month) });
    if (!insight) return res.status(404).json({ message: 'There is no insight for that month yet' });

    insight.bookmarked = !insight.bookmarked;
    await insight.save();
    res.json({ insight });
  })
);

/** Emails a month's summary to the student, or to an address they name. */
router.post(
  '/:month/share',
  wrap(async (req, res) => {
    const month = parseMonth(req.params.month);
    const insight = (await Insight.findOne({ user: req.user._id, month })) || (await generateInsight(req.user, month));
    const to = String(req.body.email || req.user.email).trim();

    if (!/^\S+@\S+\.\S+$/.test(to)) return res.status(400).json({ message: 'Enter a valid email address' });

    const body = [
      `Campus Coin - ${monthKey(month)}`,
      '',
      insight.summaryText,
      '',
      `Suggestion: ${insight.tipText}`,
      '',
      `Income ${insight.stats?.income ?? 0} | Spent ${insight.stats?.expense ?? 0} | Kept ${insight.stats?.balance ?? 0}`,
    ].join('\n');

    const result = await sendMail({ to, subject: `Your Campus Coin summary for ${monthKey(month)}`, text: body });
    res.json({
      sent: result.sent,
      message: result.sent
        ? `Summary sent to ${to}`
        : 'SMTP is not configured on this server, so nothing was emailed. The summary is below instead.',
      preview: result.sent ? undefined : body,
    });
  })
);

export default router;
