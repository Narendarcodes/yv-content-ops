const mongoose = require('mongoose');

const PerformanceMetricSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Project', index: true },
    publicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Publication', default: null },
    metric: { type: String, required: true, trim: true }, // e.g. views, likes, comments, shares, reach
    value: { type: Number, required: true },
    unit: { type: String, default: '' },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

PerformanceMetricSchema.index({ projectId: 1, recordedAt: -1 });

const PerformanceMetric = mongoose.model('PerformanceMetric', PerformanceMetricSchema);
module.exports = PerformanceMetric;
