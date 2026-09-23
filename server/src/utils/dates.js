// Every report in Campus Coin is keyed by a calendar month. The app stores that
// month as the first day of the month at UTC midnight so that two students in
// different timezones never disagree about which month a transaction belongs to.

export const startOfMonth = (date = new Date()) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

export const addMonths = (date, n) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + n, 1));

export const endOfMonth = (date) => {
  const next = addMonths(startOfMonth(date), 1);
  return new Date(next.getTime() - 1);
};

/** "2026-09" - the key used by the reports API and the month picker in the UI. */
export const monthKey = (date = new Date()) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

/** Parses "2026-09" back into the first day of that month. Falls back to this month. */
export function parseMonth(key) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(key || ''));
  if (!match) return startOfMonth();
  const month = Number(match[2]);
  if (month < 1 || month > 12) return startOfMonth();
  return new Date(Date.UTC(Number(match[1]), month - 1, 1));
}

/** The last `count` months, oldest first, ending with the given month. */
export function monthRange(end, count) {
  const start = startOfMonth(end);
  return Array.from({ length: count }, (_, i) => addMonths(start, i - (count - 1)));
}

export const dayKey = (date) => date.toISOString().slice(0, 10);

/** ISO week number, used by the weekly breakdown on the reports page. */
export function weekOfMonth(date) {
  const first = startOfMonth(date);
  return Math.floor((date.getUTCDate() + first.getUTCDay() - 1) / 7) + 1;
}

/** Advances a recurring transaction's date by one interval. */
export function nextOccurrence(date, frequency) {
  const d = new Date(date);
  if (frequency === 'weekly') d.setUTCDate(d.getUTCDate() + 7);
  else if (frequency === 'yearly') d.setUTCFullYear(d.getUTCFullYear() + 1);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
}
