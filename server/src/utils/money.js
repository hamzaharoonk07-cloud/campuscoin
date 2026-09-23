// Amounts are stored as plain numbers rounded to two decimals. Campus Coin never
// moves real money, so this is precise enough and keeps the schema readable.

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export const sum = (rows, pick = (r) => r) => round2(rows.reduce((total, row) => total + Number(pick(row) || 0), 0));

/** Percentage change from `before` to `after`, or null when there is no baseline. */
export function pctChange(before, after) {
  if (!before) return null;
  return round2(((after - before) / before) * 100);
}

export const CURRENCIES = {
  PKR: { symbol: 'Rs', name: 'Pakistani Rupee' },
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'Pound Sterling' },
  INR: { symbol: '₹', name: 'Indian Rupee' },
  AED: { symbol: 'AED', name: 'UAE Dirham' },
};

/**
 * Formats an amount the way the tips engine and the insight writer need it
 * inside a sentence: the student's own currency, no decimals, grouped
 * thousands. "12000" reads as "Rs 12,000" - a number a person can say out loud.
 */
export function formatMoney(amount, currency = 'PKR') {
  const value = Math.round(Number(amount) || 0);
  const grouped = Math.abs(value).toLocaleString('en-US');
  const symbol = CURRENCIES[currency]?.symbol || currency;
  const sign = value < 0 ? '-' : '';
  return `${sign}${symbol}${symbol.length > 1 ? ' ' : ''}${grouped}`;
}
