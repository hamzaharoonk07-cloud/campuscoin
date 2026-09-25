import crypto from 'crypto';
import express from 'express';
import User from '../models/User.js';
import { protect, signToken, wrap } from '../middleware/auth.js';
import { sendMail, mailConfigured } from '../services/mailer.js';
import { cleanImage } from '../utils/images.js';
import { passwordProblem, isDemo, MAX_FAILED, LOCK_MINUTES } from '../utils/passwords.js';

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
  avatar: user.avatar,
  preferences: user.preferences,
  passwordChangedAt: user.passwordChangedAt,
  mustChangePassword: Boolean(user.mustChangePassword),
  isDemo: isDemo(user),
  createdAt: user.createdAt,
});

const PALETTE = ['#121214', '#5b91ff', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c'];

// Where links in emails point: the configured site, else this deployment's
// production address on Vercel, else the local development client.
const siteUrl = () =>
  process.env.CLIENT_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:5173');

/** Tells the account holder their password changed, in case it was not them. */
const notifyPasswordChanged = (user) =>
  sendMail({
    to: user.email,
    subject: 'Your Campus Coin password was changed',
    text: `Hi ${user.name},\n\nThe password on your Campus Coin account was just changed, and every other device was signed out.\n\nIf this was not you, reset your password straight away at ${siteUrl()}/forgot-password.`,
  }).catch(() => {});

router.post(
  '/register',
  wrap(async (req, res) => {
    const { name, email, password, academicYear, institution, monthlyAllowance, savingsGoal, currency } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are all required' });
    }
    const problem = passwordProblem(password, { email, name });
    if (problem) return res.status(400).json({ message: problem });
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

/**
 * The password check shared by the student and administrator sign-ins, with
 * the lockout: after MAX_FAILED wrong passwords in a row the account refuses
 * sign-in for LOCK_MINUTES. Returns the user, or sends the error and returns null.
 */
async function checkSignIn(req, res, { adminOnly = false } = {}) {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || '').toLowerCase() }).select('+passwordHash +failedLogins +lockUntil');
  const wrong = adminOnly ? 'Those administrator credentials were not recognised' : 'That email and password do not match';

  if (user && user.lockUntil && user.lockUntil > new Date()) {
    const minutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
    res.status(429).json({ message: `Too many wrong passwords. This account is locked for ${minutes} more minute${minutes === 1 ? '' : 's'} - or reset the password to get in now.` });
    return null;
  }

  const ok = user && (!adminOnly || user.role === 'admin') && (await user.checkPassword(String(password || '')));
  if (!ok) {
    // Count the miss against a real account (never the shared demo ones).
    if (user && !isDemo(user)) {
      user.failedLogins = (user.failedLogins || 0) + 1;
      if (user.failedLogins >= MAX_FAILED) {
        user.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60000);
        user.failedLogins = 0;
      }
      await user.save();
    }
    // The same message whether or not the email exists, so the form cannot be
    // used to find out which addresses have accounts.
    res.status(401).json({ message: wrong });
    return null;
  }
  if (user.disabled) {
    res.status(403).json({ message: 'This account has been disabled. Please contact an administrator.' });
    return null;
  }

  user.failedLogins = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();
  return user;
}

router.post(
  '/login',
  wrap(async (req, res) => {
    const user = await checkSignIn(req, res);
    if (user) res.json({ token: signToken(user), user: publicUser(user) });
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
    const user = await checkSignIn(req, res, { adminOnly: true });
    if (user) res.json({ token: signToken(user), user: publicUser(user) });
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
    // null or '' removes the photo; anything else must be a small image.
    if (req.body.avatar !== undefined) {
      req.user.avatar = cleanImage(req.body.avatar, { maxKb: 150, label: 'Profile photo' });
    }
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  })
);

/**
 * Change password while signed in. Every other session ends; this device gets
 * a fresh token back so it stays signed in.
 */
router.post(
  '/change-password',
  protect,
  wrap(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');

    if (isDemo(user)) {
      return res.status(403).json({ message: 'The demo account keeps its published password so everyone can use it. Register your own account to try this.' });
    }
    if (!(await user.checkPassword(String(currentPassword || '')))) {
      return res.status(401).json({ message: 'Your current password is not correct' });
    }
    if (String(newPassword) === String(currentPassword)) {
      return res.status(400).json({ message: 'Choose a password different from your current one' });
    }
    const problem = passwordProblem(newPassword, user);
    if (problem) return res.status(400).json({ message: problem });

    await user.setPassword(newPassword);
    user.mustChangePassword = false;
    await user.save();
    notifyPasswordChanged(user);

    res.json({ message: 'Your password has been changed and every other device signed out', token: signToken(user), user: publicUser(user) });
  })
);

/** Signs out every other device by raising the session version. */
router.post(
  '/logout-all',
  protect,
  wrap(async (req, res) => {
    if (isDemo(req.user)) {
      return res.status(403).json({ message: 'The demo account is shared, so it cannot sign everyone else out.' });
    }
    req.user.tokenVersion = (req.user.tokenVersion || 0) + 1;
    await req.user.save();
    res.json({ message: 'Every other device has been signed out', token: signToken(req.user) });
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
    if (isDemo(user)) {
      return res.json({ ...reply, note: 'The demo accounts keep their published passwords, so no link is sent for them.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // one hour
    await user.save();

    const link = `${siteUrl()}/reset-password?token=${token}`;
    const sent = await sendMail({
      to: user.email,
      subject: 'Reset your Campus Coin password',
      text: `Open this link within the hour to choose a new password:\n\n${link}\n\nIt works once. If you did not ask for this, you can ignore it - your password stays as it is.`,
    });

    // With no SMTP configured the link comes back in the response instead, so
    // the flow is still demonstrable end to end.
    if (!sent.sent) return res.json({ ...reply, devResetLink: link, note: 'SMTP is not configured, so the link is returned here instead of emailed.' });
    res.json(reply);
  })
);

/** Checks a reset link before the form is shown, so an expired one says so up front. */
router.get(
  '/reset-password/check',
  wrap(async (req, res) => {
    const hash = crypto.createHash('sha256').update(String(req.query.token || '')).digest('hex');
    const user = await User.findOne({ resetTokenHash: hash, resetTokenExpires: { $gt: new Date() } }).select('+resetTokenHash +resetTokenExpires');
    res.json({ valid: Boolean(user), email: user ? user.email.replace(/^(.).*(@.*)$/, '$1•••$2') : null });
  })
);

router.post(
  '/reset-password',
  wrap(async (req, res) => {
    const { token, password } = req.body;
    const hash = crypto.createHash('sha256').update(String(token || '')).digest('hex');
    const user = await User.findOne({ resetTokenHash: hash, resetTokenExpires: { $gt: new Date() } }).select(
      '+passwordHash +resetTokenHash +resetTokenExpires +failedLogins +lockUntil'
    );
    if (!user) return res.status(400).json({ message: 'That reset link is invalid or has expired' });

    const problem = passwordProblem(password, user);
    if (problem) return res.status(400).json({ message: problem });

    await user.setPassword(password);
    // The link works once, and a reset also lifts any sign-in lock.
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    user.failedLogins = 0;
    user.lockUntil = undefined;
    user.mustChangePassword = false;
    await user.save();
    notifyPasswordChanged(user);

    res.json({ token: signToken(user), user: publicUser(user), message: 'Your password has been reset' });
  })
);

router.get('/mail-status', (req, res) => res.json({ configured: mailConfigured() }));

export { publicUser };
export default router;
