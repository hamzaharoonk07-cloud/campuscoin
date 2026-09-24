import crypto from 'crypto';
import express from 'express';
import User from '../models/User.js';
import { protect, signToken, wrap } from '../middleware/auth.js';
import { sendMail, mailConfigured } from '../services/mailer.js';

const router = express.Router();

// What the client is allowed to see about the signed-in user.
const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  academicYear: user.academicYear,
  institution: user.institution,
  monthlyAllowance: user.monthlyAllowance,
  savingsGoal: user.savingsGoal,
  currency: user.currency,
  avatarColor: user.avatarColor,
  preferences: user.preferences,
  createdAt: user.createdAt,
});

const PALETTE = ['#0b5f80', '#4ade80', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c'];

router.post(
  '/register',
  wrap(async (req, res) => {
    const { name, email, password, academicYear, institution, monthlyAllowance, savingsGoal, currency } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are all required' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Choose a password of at least 8 characters' });
    }
    if (await User.findOne({ email: String(email).toLowerCase() })) {
      return res.status(409).json({ message: 'An account with that email already exists' });
    }

    const user = new User({
      name,
      email,
      academicYear: academicYear || '',
      institution: institution || '',
      monthlyAllowance: Number(monthlyAllowance) || 0,
      savingsGoal: Number(savingsGoal) || 0,
      currency: currency || 'PKR',
      avatarColor: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      // Students always register as students; the admin account is seeded.
      role: 'student',
    });
    await user.setPassword(password);
    await user.save();

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  })
);

router.post(
  '/login',
  wrap(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase() }).select('+passwordHash');

    // The same message either way, so the form cannot be used to discover
    // which email addresses have accounts.
    if (!user || !(await user.checkPassword(String(password || '')))) {
      return res.status(401).json({ message: 'That email and password do not match' });
    }
    if (user.disabled) {
      return res.status(403).json({ message: 'This account has been disabled. Please contact an administrator.' });
    }

    user.lastLoginAt = new Date();
    await user.save();
    res.json({ token: signToken(user), user: publicUser(user) });
  })
);

/**
 * The SRS asks for a separate, direct-access administrator login. It is the same
 * credential check with an extra role gate, so a student's password can never
 * open the admin panel even if they find the URL.
 */
router.post(
  '/admin/login',
  wrap(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase() }).select('+passwordHash');

    if (!user || user.role !== 'admin' || !(await user.checkPassword(String(password || '')))) {
      return res.status(401).json({ message: 'Those administrator credentials were not recognised' });
    }

    user.lastLoginAt = new Date();
    await user.save();
    res.json({ token: signToken(user), user: publicUser(user) });
  })
);

router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));

router.patch(
  '/me',
  protect,
  wrap(async (req, res) => {
    const fields = ['name', 'academicYear', 'institution', 'monthlyAllowance', 'savingsGoal', 'currency', 'avatarColor'];
    for (const field of fields) {
      if (req.body[field] !== undefined) req.user[field] = req.body[field];
    }
    if (req.body.preferences) {
      req.user.preferences = { ...req.user.preferences.toObject(), ...req.body.preferences };
    }
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  })
);

router.post(
  '/change-password',
  protect,
  wrap(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');

    if (!(await user.checkPassword(String(currentPassword || '')))) {
      return res.status(401).json({ message: 'Your current password is not correct' });
    }
    if (String(newPassword || '').length < 8) {
      return res.status(400).json({ message: 'Choose a new password of at least 8 characters' });
    }

    await user.setPassword(newPassword);
    await user.save();
    res.json({ message: 'Your password has been changed' });
  })
);

/**
 * Password recovery. A random token is emailed; only its hash is stored, so a
 * leaked database cannot be used to reset anyone's password.
 */
router.post(
  '/forgot-password',
  wrap(async (req, res) => {
    const email = String(req.body.email || '').toLowerCase();
    const user = await User.findOne({ email });

    // Always the same reply, so this endpoint cannot enumerate accounts.
    const reply = { message: 'If that email has an account, a reset link is on its way.' };
    if (!user) return res.json(reply);

    const token = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // one hour
    await user.save();

    const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    const sent = await sendMail({
      to: user.email,
      subject: 'Reset your Campus Coin password',
      text: `Open this link within the hour to choose a new password:\n\n${link}\n\nIf you did not ask for this, you can ignore it.`,
    });

    // With no SMTP configured the link comes back in the response instead, so
    // the flow is still demonstrable end to end.
    if (!sent.sent) return res.json({ ...reply, devResetLink: link, note: 'SMTP is not configured, so the link is returned here instead of emailed.' });
    res.json(reply);
  })
);

router.post(
  '/reset-password',
  wrap(async (req, res) => {
    const { token, password } = req.body;
    if (String(password || '').length < 8) {
      return res.status(400).json({ message: 'Choose a password of at least 8 characters' });
    }

    const hash = crypto.createHash('sha256').update(String(token || '')).digest('hex');
    const user = await User.findOne({ resetTokenHash: hash, resetTokenExpires: { $gt: new Date() } }).select(
      '+passwordHash +resetTokenHash +resetTokenExpires'
    );
    if (!user) return res.status(400).json({ message: 'That reset link is invalid or has expired' });

    await user.setPassword(password);
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.json({ token: signToken(user), user: publicUser(user), message: 'Your password has been reset' });
  })
);

router.get('/mail-status', (req, res) => res.json({ configured: mailConfigured() }));

export { publicUser };
export default router;
