import mongoose from 'mongoose';

// A saving tip produced by the tips engine for one student. Tips are regenerated
// from live data, so `key` identifies the same advice across regenerations and
// lets a pin or a dismissal survive.
const tipSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    key: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    // Estimated money this tip could free up per month - the ranking signal.
    impact: { type: Number, default: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    categoryName: { type: String, default: '' },
    status: { type: String, enum: ['active', 'pinned', 'dismissed'], default: 'active', index: true },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

tipSchema.index({ user: 1, key: 1 }, { unique: true });

export default mongoose.models.Tip || mongoose.model('Tip', tipSchema);
