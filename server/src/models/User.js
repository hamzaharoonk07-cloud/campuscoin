import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address'],
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['student', 'admin'], default: 'student', index: true },

    // Profile fields from the SRS (section 1.6, "User Authentication and Management")
    academicYear: { type: String, enum: ['', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Masters', 'PhD'], default: '' },
    institution: { type: String, trim: true, maxlength: 120, default: '' },
    monthlyAllowance: { type: Number, default: 0, min: 0 },
    savingsGoal: { type: Number, default: 0, min: 0 },
    currency: { type: String, enum: ['PKR', 'USD', 'EUR', 'GBP', 'INR', 'AED'], default: 'PKR' },
    avatarColor: { type: String, default: '#121214' },
    // An optional profile photo as a small data URL (see utils/images.js).
    // The coloured initial is shown whenever this is empty.
    avatar: { type: String, default: '' },

    // Accessibility preferences (SRS "Accessibility and UI Enhancements")
    preferences: {
      theme: { type: String, enum: ['dark', 'light', 'system'], default: 'light' },
      fontScale: { type: Number, default: 1, min: 0.875, max: 1.375 },
      reducedMotion: { type: Boolean, default: false },
      alertsEnabled: { type: Boolean, default: true },
    },

    disabled: { type: Boolean, default: false },
    lastLoginAt: Date,

    // Password reset: only the hash of the token is stored, never the token itself.
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, 10);
};

userSchema.methods.checkPassword = function checkPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

export default mongoose.models.User || mongoose.model('User', userSchema);
