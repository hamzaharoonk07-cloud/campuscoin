import Transaction from '../models/Transaction.js';
import { nextOccurrence } from '../utils/dates.js';

// ---------------------------------------------------------------------------
// Recurring entries
//
// A recurring transaction is an ordinary transaction with a rule attached. This
// job walks every rule whose next run has come due and writes the real copies,
// catching up if the app was not opened for a while. Each generated copy points
// back at its parent, so deleting the rule can clean up after itself.
// ---------------------------------------------------------------------------

const MAX_CATCH_UP = 24; // guards against a rule with a date far in the past

export async function runRecurring(userId = null) {
  const now = new Date();
  const filter = {
    'recurring.enabled': true,
    'recurring.nextRun': { $lte: now },
    recurringParent: null,
  };
  if (userId) filter.user = userId;

  const rules = await Transaction.find(filter);
  const created = [];

  for (const rule of rules) {
    let due = rule.recurring.nextRun;
    let guard = 0;

    while (due && due <= now && guard < MAX_CATCH_UP) {
      if (rule.recurring.endsOn && due > rule.recurring.endsOn) break;

      // Never write the same occurrence twice, even if this job overlaps itself.
      const exists = await Transaction.findOne({ recurringParent: rule._id, date: due });
      if (!exists) {
        const copy = await Transaction.create({
          user: rule.user,
          category: rule.category,
          type: rule.type,
          amount: rule.amount,
          description: rule.description,
          note: rule.note,
          date: due,
          source: 'recurring',
          recurringParent: rule._id,
        });
        created.push(copy);
      }

      due = nextOccurrence(due, rule.recurring.frequency);
      guard += 1;
    }

    rule.recurring.nextRun = due;
    if (rule.recurring.endsOn && due > rule.recurring.endsOn) rule.recurring.enabled = false;
    await rule.save();
  }

  return created;
}
