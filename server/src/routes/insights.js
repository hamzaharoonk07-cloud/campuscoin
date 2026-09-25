import express from 'express';
import Insight from '../models/Insight.js';
import { protect, wrap } from '../middleware/auth.js';
import { generateInsight, monthDetails } from '../services/insights.js';
import { llmEnabled } from '../services/llm.js';
import { sendMail } from '../services/mailer.js';
import { parseMonth } from '../utils/dates.js';
import { formatMoney } from '../utils/money.js';
import { siteUrl } from '../utils/site.js';
import { emailLayout } from '../services/emailTemplate.js';

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
    // The score, categories, habits and budgets beside the summary.
    const details = await monthDetails(req.user, month);
    res.json({ insight, details, aiEnabled: llmEnabled() });
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

    const currency = req.user.currency || 'PKR';
    const fmt = (n) => formatMoney(n ?? 0, currency);
    const label = month.toLocaleString('en', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    const mail = emailLayout({
      heading: `Your ${label} in Campus Coin`,
      preheader: `Kept ${fmt(insight.stats?.balance)} in ${label}.`,
      paragraphs: [insight.summaryText],
      stats: [
        { label: 'Came in', value: fmt(insight.stats?.income) },
        { label: 'Spent', value: fmt(insight.stats?.expense) },
        { label: (insight.stats?.balance ?? 0) < 0 ? 'Over by' : 'Kept', value: fmt(Math.abs(insight.stats?.balance ?? 0)), tone: (insight.stats?.balance ?? 0) < 0 ? 'bad' : '' },
      ],
      tip: insight.tipText || '',
      button: { label: 'See the full insight', url: `${siteUrl()}/insights` },
      note: 'A prompt to look closer, not financial advice.',
    });
    const body = mail.text;

    const result = await sendMail({ to, subject: `Your Campus Coin summary for ${label}`, ...mail });
    res.json({
      sent: result.sent,
      message: result.sent
        ? `Summary sent to ${to}`
        : 'Email could not be sent to that address, so nothing went out. The summary is below instead.',
      preview: result.sent ? undefined : body,
    });
  })
);

export default router;
