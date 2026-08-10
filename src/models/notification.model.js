const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    type: { type: String, required: true }, // e.g. draft_uploaded, comment_added, revision_requested, approved, published
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    title: { type: String, default: '' },
    body: { type: String, default: '' },
    payload: { type: Object, default: {} },
    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', NotificationSchema);
module.exports = Notification;
