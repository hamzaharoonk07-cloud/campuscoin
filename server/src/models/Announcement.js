import mongoose from 'mongoose';

// Written by an administrator. Announcements show on every student dashboard;
// tip templates are seeded into a student's tip feed alongside generated tips.
const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    body: { type: String, required: true, trim: true, maxlength: 1000 },
    kind: { type: String, enum: ['announcement', 'tip-template'], default: 'announcement', index: true },
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);
