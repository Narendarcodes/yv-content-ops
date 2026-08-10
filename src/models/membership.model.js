const mongoose = require('mongoose');

const MembershipSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Organization' },
    role: { type: String, required: true },
    disabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MembershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });

const Membership = mongoose.model('Membership', MembershipSchema);
module.exports = Membership;
