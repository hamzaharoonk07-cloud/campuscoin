import Transaction from '../models/Transaction.js';
import { addMonths, startOfMonth } from '../utils/dates.js';
import { round2 } from '../utils/money.js';

// ---------------------------------------------------------------------------
// Unusually large, duplicate, and cash-with-no-source transaction detection
//
// "Unusually large" is measured against the student's own history in the same
// category, not a fixed threshold: 500 is unremarkable for Hostel/Rent and very
// odd for Transport. A category needs a few prior entries before it can call
// anything unusual, so a new account is never nagged about its first purchase.
// ---------------------------------------------------------------------------

const MIN_HISTORY = 4;
const LARGE_MULTIPLIER = 2.5;
const DUPLICATE_WINDOW_HOURS = 48;

/**
 * Returns the flags that apply to a transaction. Pure - it does not save
 * anything, so the caller decides whether to store them or just warn.
 */
export async function detectFlags(transaction) {
  const flags = [];
  const { user, category, amount, date, _id } = transaction;

  // 1. Large against this category's own history.
  const since = addMonths(startOfMonth(date), -6);
  const history = await Transaction.find({
    user,
    category,
    type: transaction.type,
    date: { $gte: since },
    _id: { $ne: _id },
  }).select('amount');

  if (history.length >= MIN_HISTORY) {
    const mean = history.reduce((acc, row) => acc + row.amount, 0) / history.length;
    if (mean > 0 && amount > mean * LARGE_MULTIPLIER) flags.push('large');
  }

  // 2. Same amount, same category, within two days - usually a double entry.
  const from = new Date(date.getTime() - DUPLICATE_WINDOW_HOURS * 3600 * 1000);
  const to = new Date(date.getTime() + DUPLICATE_WINDOW_HOURS * 3600 * 1000);
  const twin = await Transaction.findOne({
    user,
    category,
    amount,
    date: { $gte: from, $lte: to },
    _id: { $ne: _id },
  });
  if (twin) flags.push('duplicate');

  // 3. Cash spent with no cash logged coming in this month. Not proof of a
  // mistake - an ATM withdrawal or cash handed over in person never shows up
  // as income here - but worth a flag rather than a silent, unexplained
  // "cash out" figure with nothing behind it.
  if (transaction.type === 'expense' && (transaction.method || 'cash') === 'cash') {
    const cashIn = await Transaction.exists({
      user,
      type: 'income',
      method: 'cash',
      month: transaction.month || startOfMonth(date),
    });
    if (!cashIn) flags.push('cash-no-source');
  }

  return flags;
}

/** Human wording for a flag, used by the notification and the transaction row. */
export function describeFlag(flag, transaction) {
  if (flag === 'large') {
    return `${round2(transaction.amount)} is well above what you normally spend in this category.`;
  }
  if (flag === 'duplicate') {
    return 'An identical amount was logged in this category within two days - check it is not entered twice.';
  }
  if (flag === 'cash-no-source') {
    return "No cash income is logged for this month yet, so this cash spending has nothing recorded behind it - normal if it came from an ATM withdrawal or was handed to you in person, worth a second look otherwise.";
  }
  return '';
}
