import mongoose from 'mongoose';
import { startOfMonth } from '../utils/dates.js';

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    type: { type: String, enum: ['income', 'expense'], required: true, index: true },
    amount: { type: Number, required: [true, 'Amount is required'], min: [0.01, 'Amount must be greater than zero'] },
    description: { type: String, trim: true, maxlength: 200, default: '' },
    note: { type: String, trim: true, maxlength: 500, default: '' },
    date: { type: Date, required: true, index: true },
    // Denormalised month key so reports can group without a date pipeline.
    month: { type: Date, index: true },

    // Set when the categorisation assistant proposed a category. Comparing this
    // with `category` is what tells the assistant it guessed wrong and should learn.
    aiSuggestedCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    aiAccepted: { type: Boolean, default: null },

    // Recurring entries (monthly allowance, subscriptions). The parent row holds
    // the rule; each generated copy points back at it through recurringParent.
    recurring: {
      enabled: { type: Boolean, default: false },
      frequency: { type: String, enum: ['weekly', 'monthly', 'yearly'], default: 'monthly' },
      nextRun: Date,
      endsOn: Date,
    },
    recurringParent: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', default: null },

    source: { type: String, enum: ['manual', 'csv', 'recurring'], default: 'manual' },
    // Flags raised by the anomaly check (unusually large / possible duplicate).
    flags: { type: [String], default: [] },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, month: 1, type: 1 });

transactionSchema.pre('validate', function setMonth(next) {
  if (this.date) this.month = startOfMonth(this.date);
  next();
});

export default mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
