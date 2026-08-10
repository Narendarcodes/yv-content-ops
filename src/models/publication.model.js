const mongoose = require('mongoose');

const PublicationSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Project', index: true },
    platform: { type: String, required: true, trim: true },
    postUrl: { type: String, default: '' },
    postId: { type: String, default: '' },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

PublicationSchema.index({ projectId: 1, publishedAt: -1 });

const Publication = mongoose.model('Publication', PublicationSchema);
module.exports = Publication;
