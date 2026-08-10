const mongoose = require('mongoose');

/**
 * Brief — structured creative brief per project (Fluit Brief equivalent).
 * One brief per project; collects goals, audience, references, deliverables,
 * deadlines and brand guidance so the team starts with full context.
 */
const BriefSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Project', unique: true },
    goal: { type: String, default: '', maxlength: 5000 },
    targetAudience: { type: String, default: '', maxlength: 2000 },
    videoType: { type: String, default: '', maxlength: 200 },
    references: [{ type: String, maxlength: 2000 }],
    deliverables: [{ type: String, maxlength: 500 }],
    deadline: { type: Date, default: null },
    brandGuidelines: { type: String, default: '', maxlength: 10000 },
    specialInstructions: { type: String, default: '', maxlength: 10000 },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

const Brief = mongoose.model('Brief', BriefSchema);
module.exports = Brief;
