import mongoose from 'mongoose';

// In-app alerts: budget warnings, anomaly flags and admin announcements all land
// in the same bell menu so a student has one place to look.
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: {
      type: String,
      enum: ['budget-warning', 'budget-exceeded', 'anomaly', 'insight', 'announcement'],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
