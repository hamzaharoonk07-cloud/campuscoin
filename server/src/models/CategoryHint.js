import mongoose from 'mongoose';

// The memory behind the categorisation assistant.
//
// Every time a student saves a transaction, each word of the description is
// stored against the category they actually chose. Counting those pairs gives a
// per-student word-to-category frequency table, which is what lets the assistant
// improve when a student corrects one of its guesses: the correction simply
// reinforces a different pairing than the one it proposed.
const categoryHintSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    count: { type: Number, default: 1 },
  },
  { timestamps: true }
);

categoryHintSchema.index({ user: 1, token: 1, category: 1 }, { unique: true });

export default mongoose.models.CategoryHint || mongoose.model('CategoryHint', categoryHintSchema);
