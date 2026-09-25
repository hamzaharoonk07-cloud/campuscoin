/* ---------------------------------------------------------------------------
   The password rules, for the live checklist under a new-password field.
   They mirror server/src/utils/passwords.js so the form can say what is
   missing as the student types; the server still decides.
--------------------------------------------------------------------------- */

const COMMON = new Set([
  'password', 'password1', 'password123', 'passw0rd', '12345678', '123456789', '1234567890', 'qwerty123',
  'qwertyuiop', 'iloveyou', 'abc12345', 'abcd1234', 'admin123', 'welcome1', 'letmein1', 'sunshine1',
  'football1', 'monkey123', 'pakistan1', 'pakistan123', 'karachi123', 'lahore123', 'student1', 'student123',
  'campuscoin', 'campuscoin1', 'campus123', 'aptech123', '11111111', '00000000', 'asdf1234', 'zaq12wsx',
]);

/** The rules, each with the words shown in the checklist. */
export function passwordChecks(password, { email = '', name = '' } = {}) {
  const value = String(password || '');
  const lower = value.toLowerCase();
  const local = String(email).toLowerCase().split('@')[0];
  const first = String(name).toLowerCase().split(' ')[0];
  return [
    { key: 'length', label: 'At least 8 characters', ok: value.length >= 8 },
    { key: 'mix', label: 'Letters and numbers', ok: /[a-z]/i.test(value) && /\d/.test(value) },
    {
      key: 'own',
      label: 'Not your name, email or a common password',
      ok:
        value.length > 0 &&
        !COMMON.has(lower) &&
        !(local.length >= 4 && lower.includes(local)) &&
        !(first.length >= 4 && lower.includes(first)),
    },
  ];
}

/**
 * How strong the password is, 0 to 4, for the meter. Passing every rule makes
 * it at least "fair"; length, mixed case and symbols add to that.
 */
export function passwordStrength(password, who) {
  const value = String(password || '');
  if (!value) return { score: 0, label: '' };
  const passes = passwordChecks(value, who).every((c) => c.ok);
  if (!passes) return { score: 1, label: 'Too weak' };
  let score = 2;
  if (value.length >= 12) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value) && /[^a-z0-9]/i.test(value)) score += 1;
  return { score, label: ['', 'Too weak', 'Fair', 'Good', 'Strong'][score] };
}

export const passwordOk = (password, who) => passwordChecks(password, who).every((c) => c.ok);
