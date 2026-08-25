/**
 * Concept - a content idea proposed before it becomes a project.
 * Lifecycle: IDEA -> APPROVED (then a project is created from it) or declined.
 */
const mongoose = require('mongoose');

const conceptSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    type: {
      type: String,
      enum: ['New Concept', 'Experiment', 'Revision'],
      default: 'New Concept',
    },
    status: {
      type: String,
      enum: ['IDEA', 'APPROVED', 'DECLINED'],
      default: 'IDEA',
      index: true,
    },
    proposer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedProjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Concept', conceptSchema);
