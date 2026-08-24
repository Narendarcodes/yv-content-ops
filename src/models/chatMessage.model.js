const mongoose = require('mongoose');

/**
 * ChatMessage — message inside a channel (Fluit Chat equivalent).
 * parentId enables threaded replies. attachments reference stored files.
 */
const ChatMessageSchema = new mongoose.Schema(
  {
    channelId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Channel', index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Project', index: true },
    author: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage', default: null },
    body: { type: String, required: true, trim: true, maxlength: 10000 },
    attachments: [{ type: String, maxlength: 2000 }],
    // Real timestamp of the message (e.g. from a WhatsApp export). Falls back
    // to `createdAt` (insert time) when not set.
    sentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ChatMessageSchema.index({ channelId: 1, createdAt: 1 });

const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);
module.exports = ChatMessage;
