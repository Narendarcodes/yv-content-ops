const mongoose = require('mongoose');

/**
 * Invoice — client billing record with payment status (Fluit Client equivalent).
 * status: draft -> sent -> paid | overdue (computed) | void.
 * Payment is tracked as a status transition; no external payment gateway is
 * wired, so 'paid' is recorded by the issuer (payment links can be added later).
 */
const InvoiceSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Organization', index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    number: { type: String, required: true, trim: true, maxlength: 100 },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', maxlength: 10 },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue', 'void'],
      default: 'draft',
      index: true,
    },
    issuedAt: { type: Date, default: Date.now },
    dueDate: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    paymentMethod: { type: String, default: '', maxlength: 100 },
    note: { type: String, default: '', maxlength: 5000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

InvoiceSchema.index({ organizationId: 1, status: 1, dueDate: 1 });

const Invoice = mongoose.model('Invoice', InvoiceSchema);
module.exports = Invoice;
