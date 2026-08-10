const mongoose = require('mongoose');

/**
 * Channel — communication space inside a project (Fluit Chat equivalent).
 * type: 'channel' is a topic channel, 'dm' is a direct-message channel.
 * members: optional access list; empty = all project members can see it.
 */
const ChannelSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Project', index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    type: { type: String, enum: ['channel', 'dm'], default: 'channel' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

ChannelSchema.index({ projectId: 1, type: 1 });

const Channel = mongoose.model('Channel', ChannelSchema);
module.exports = Channel;
