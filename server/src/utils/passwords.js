/* ---------------------------------------------------------------------------
   Password rules, used by registration, reset and change.

   Deliberately simple and explainable: long enough, a mix of letters and
   numbers, not one of the passwords people use most, and not built from the
   account's own email or name. The client shows the same checks as a live
   list (client/src/lib/password.js), but only this file decides.
--------------------------------------------------------------------------- */

import crypto from 'crypto';

export const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

// The most common passwords in public breach lists, plus the obvious ones for
// this app. A password on this list is refused whatever else it contains.
const COMMON = new Set([
  'password', 'password1', 'password123', 'passw0rd', '12345678', '123456789', '1234567890', 'qwerty123',
  'qwertyuiop', 'iloveyou', 'abc12345', 'abcd1234', 'admin123', 'welcome1', 'letmein1', 'sunshine1',
  'football1', 'monkey123', 'pakistan1', 'pakistan123', 'karachi123', 'lahore123', 'student1', 'student123',
  'campuscoin', 'campuscoin1', 'campus123', 'aptech123', '11111111', '00000000', 'asdf1234', 'zaq12wsx',
]);

/**
 * Returns what is wrong with a password, or null when it is acceptable.
 * `email` and `name` are the account's own, used to refuse passwords built
 * from them.
 */
export function passwordProblem(password, { email = '', name = '' } = {}) {
  const value = String(password || '');
  const lower = value.toLowerCase();

  if (value.length < MIN_LENGTH) return `Use at least ${MIN_LENGTH} characters`;
  if (value.length > MAX_LENGTH) return `Use at most ${MAX_LENGTH} characters`;
  if (!/[a-z]/i.test(value) || !/\d/.test(value)) return 'Use a mix of letters and numbers';
  if (COMMON.has(lower)) return 'That password is one of the most common - choose something less guessable';

  const local = String(email).toLowerCase().split('@')[0];
  if (local.length >= 4 && lower.includes(local)) return 'Do not build your password from your email address';
  const first = String(name).toLowerCase().split(' ')[0];
  if (first.length >= 4 && lower.includes(first)) return 'Do not build your password from your name';

  return null;
}

/** A temporary password for an administrator reset: random, readable, 12 characters. */
export function temporaryPassword() {
  // No 0/O or 1/l, so it can be read out or copied by hand without mistakes.
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(10);
  let out = '';
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  // Always ends with a digit, so it passes the letters-and-numbers rule.
  return `cc-${out}${2 + (bytes[0] % 8)}`;
}

// The shared demo accounts, whose credentials are published in the README and
// the project report. Their passwords cannot be changed and they are never
// locked, so a visitor cannot lock the judges out of the demo.
export const DEMO_EMAILS = new Set(['student@campuscoin.app', 'bilal@campuscoin.app', 'admin@campuscoin.app']);
export const isDemo = (user) => DEMO_EMAILS.has(String(user?.email || '').toLowerCase());

// Sign-in lockout: after this many wrong passwords in a row, the account
// refuses sign-in for a while, which makes guessing a password impractical.
export const MAX_FAILED = 5;
export const LOCK_MINUTES = 15;
