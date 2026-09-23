import mongoose from 'mongoose';

// Categories are either system defaults (owner = null, managed by the admin and
// visible to everyone) or personal categories a student created for themselves.
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Category name is required'], trim: true, maxlength: 40 },
    type: { type: String, enum: ['income', 'expense'], required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    isDefault: { type: Boolean, default: false },
    icon: { type: String, default: 'tag' },
    // A slot in the validated categorical palette (1-7) rather than a raw hex.
    // Storing the slot lets the same category take its correct light-mode and
    // dark-mode step, which a single stored colour could never do.
    slot: { type: Number, default: 7, min: 1, max: 7 },
    // Words that hint at this category, used by the categorisation assistant.
    keywords: { type: [String], default: [] },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// A student cannot have two categories with the same name and type.
categorySchema.index({ owner: 1, type: 1, name: 1 }, { unique: true });

export default mongoose.models.Category || mongoose.model('Category', categorySchema);
