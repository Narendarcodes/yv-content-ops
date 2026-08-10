const mongoose = require('mongoose');

const InputSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Project', index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    source: { type: String, default: '' },
    state: {
      type: String,
      enum: ['requested', 'received', 'missing', 'blocked'],
      default: 'requested',
    },
    assetRef: { type: String, default: '' },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    requestedAt: { type: Date, default: Date.now },
    receivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

InputSchema.index({ projectId: 1, state: 1 });

const Input = mongoose.model('Input', InputSchema);
module.exports = Input;
