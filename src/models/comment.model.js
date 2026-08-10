const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Project', index: true },
    versionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectVersion', default: null },
    author: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    body: { type: String, required: true, trim: true, maxlength: 10000 },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CommentSchema.index({ projectId: 1, versionId: 1, createdAt: 1 });

const Comment = mongoose.model('Comment', CommentSchema);
module.exports = Comment;
