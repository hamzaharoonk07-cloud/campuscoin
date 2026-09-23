import mongoose from 'mongoose';

// A stored monthly summary. Keeping history means a student can reopen any past
// month and read what the assistant told them at the time (SRS: "Stores insight
// history so students can review past months summaries").
const insightSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    month: { type: Date, required: true, index: true },
    summaryText: { type: String, default: '' },
    tipText: { type: String, default: '' },
    // Categories that grew or shrank noticeably against the student's own trend.
    highlights: [
      {
        categoryName: String,
        amount: Number,
        previousAmount: Number,
        changePct: Number,
        direction: { type: String, enum: ['up', 'down'] },
      },
    ],
    stats: {
      income: Number,
      expense: Number,
      balance: Number,
      savingsRate: Number,
      topCategory: String,
      transactionCount: Number,
    },
    engine: { type: String, enum: ['statistical', 'llm'], default: 'statistical' },
    bookmarked: { type: Boolean, default: false },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

insightSchema.index({ user: 1, month: 1 }, { unique: true });

export default mongoose.models.Insight || mongoose.model('Insight', insightSchema);
