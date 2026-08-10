const mongoose = require('mongoose');

/**
 * Contract — client agreement with e-sign lifecycle (Fluit Client equivalent).
 * status flow: draft -> sent -> viewed -> signed.
 * signerName/signerEmail/signedAt capture the (self-attested) e-signature.
 */
const ContractSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Organization', index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    terms: { type: String, default: '', maxlength: 100000 },
    amount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'USD', maxlength: 10 },
    status: {
      type: String,
      enum: ['draft', 'sent', 'viewed', 'signed'],
      default: 'draft',
      index: true,
    },
    sentTo: { type: String, default: '', maxlength: 300 },
    sentAt: { type: Date, default: null },
    viewedAt: { type: Date, default: null },
    signedAt: { type: Date, default: null },
    signedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    signerName: { type: String, default: '', maxlength: 200 },
    signerEmail: { type: String, default: '', maxlength: 300 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

ContractSchema.index({ organizationId: 1, status: 1, createdAt: -1 });

const Contract = mongoose.model('Contract', ContractSchema);
module.exports = Contract;
