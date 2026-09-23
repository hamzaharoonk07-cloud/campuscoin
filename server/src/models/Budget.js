import mongoose from 'mongoose';

// One spending cap per category per month, e.g. "Food, October, 12000".
const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    month: { type: Date, required: true, index: true },
    limitAmount: { type: Number, required: true, min: [0, 'A budget cannot be negative'] },
    // Remembers the highest alert level already raised (80 or 100) so a student
    // is warned once per threshold instead of on every new transaction.
    alertedAt: { type: Number, default: 0 },
  },
  { timestamps: true }
);

budgetSchema.index({ user: 1, category: 1, month: 1 }, { unique: true });

export default mongoose.models.Budget || mongoose.model('Budget', budgetSchema);
