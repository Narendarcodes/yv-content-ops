const Invoice = require('../models/invoice.model');
const Project = require('../models/project.model');
const bus = require('../events/hub');

const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'void'];

async function assertOrg(organizationId) {
  const Organization = require('../models/organization.model');
  const org = await Organization.findById(organizationId);
  if (!org) throw { status: 404, code: 'organization_not_found', message: 'Organization not found' };
  return org;
}

async function assertProjectIfSet(projectId, organizationId) {
  if (!projectId) return;
  const p = await Project.findOne({ _id: projectId, organizationId });
  if (!p) throw { status: 404, code: 'project_not_found', message: 'Project not found' };
}

/**
 * Lazily mark sent invoices past due as 'overdue' (deterministic, date-based).
 */
async function refreshOverdueStatus(invoice) {
  if (invoice.status === 'sent' && invoice.dueDate && invoice.dueDate < new Date()) {
    invoice.status = 'overdue';
    await invoice.save();
  }
  return invoice;
}

async function listInvoices({ organizationId, status, limit = 100, skip = 0 }) {
  await assertOrg(organizationId);
  const q = { organizationId };
  if (status) q.status = status;
  const items = await Invoice.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit);
  await Promise.all(items.map(refreshOverdueStatus));
  const total = await Invoice.countDocuments(q);
  return { items, total, limit, skip };
}

async function createInvoice({ organizationId, projectId = null, number, amount, currency = 'USD', dueDate = null, note = '', createdBy }) {
  await assertOrg(organizationId);
  await assertProjectIfSet(projectId, organizationId);
  const invoice = new Invoice({ organizationId, projectId, number, amount, currency, dueDate, note, createdBy });
  await invoice.save();
  await bus.emitAsync('invoice.created', { organizationId, projectId, invoice, actorId: createdBy });
  return invoice;
}

async function getInvoice({ organizationId, invoiceId }) {
  const invoice = await Invoice.findOne({ _id: invoiceId, organizationId });
  if (!invoice) throw { status: 404, code: 'invoice_not_found', message: 'Invoice not found' };
  return refreshOverdueStatus(invoice);
}

async function updateInvoice({ organizationId, invoiceId, actorId, fields = {} }) {
  const invoice = await getInvoice({ organizationId, invoiceId });
  if (invoice.status !== 'draft') {
    throw { status: 400, code: 'invoice_not_editable', message: 'Only draft invoices can be edited' };
  }
  const changes = {};
  for (const k of ['number', 'amount', 'currency', 'projectId', 'dueDate', 'note']) {
    if (fields[k] !== undefined) changes[k] = fields[k];
  }
  if (changes.projectId !== undefined) await assertProjectIfSet(changes.projectId, organizationId);
  Object.assign(invoice, changes);
  await invoice.save();
  await bus.emitAsync('invoice.updated', { organizationId, invoiceId, actorId });
  return invoice;
}

async function sendInvoice({ organizationId, invoiceId, actorId }) {
  const invoice = await getInvoice({ organizationId, invoiceId });
  if (invoice.status !== 'draft') {
    throw { status: 400, code: 'invalid_status', message: 'Only draft invoices can be sent' };
  }
  invoice.status = 'sent';
  invoice.issuedAt = new Date();
  if (!invoice.dueDate) invoice.dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // net-30 default
  await invoice.save();
  await bus.emitAsync('invoice.sent', { organizationId, invoiceId: invoice._id, invoice, actorId });
  return invoice;
}

async function recordPayment({ organizationId, invoiceId, actorId, paymentMethod = '', paidAt = null }) {
  const invoice = await getInvoice({ organizationId, invoiceId });
  if (invoice.status === 'paid') throw { status: 400, code: 'already_paid', message: 'Invoice is already paid' };
  if (invoice.status === 'void') throw { status: 400, code: 'invoice_void', message: 'Void invoices cannot be paid' };
  invoice.status = 'paid';
  invoice.paidAt = paidAt || new Date();
  invoice.paymentMethod = paymentMethod || invoice.paymentMethod;
  await invoice.save();
  await bus.emitAsync('invoice.paid', { organizationId, invoiceId: invoice._id, invoice, actorId });
  return invoice;
}

async function voidInvoice({ organizationId, invoiceId, actorId }) {
  const invoice = await getInvoice({ organizationId, invoiceId });
  if (invoice.status === 'paid') throw { status: 400, code: 'already_paid', message: 'Paid invoices cannot be voided' };
  invoice.status = 'void';
  await invoice.save();
  await bus.emitAsync('invoice.voided', { organizationId, invoiceId: invoice._id, invoice, actorId });
  return invoice;
}

/**
 * Outstanding revenue across unpaid invoices (Fluit Intelligence-style query):
 * sent + overdue invoices.
 */
async function outstanding({ organizationId }) {
  await assertOrg(organizationId);
  const invoices = await Invoice.find({ organizationId, status: { $in: ['sent', 'overdue'] } });
  const refreshed = await Promise.all(invoices.map(refreshOverdueStatus));
  const total = refreshed.reduce((sum, i) => sum + i.amount, 0);
  const byCurrency = {};
  for (const i of refreshed) {
    byCurrency[i.currency] = (byCurrency[i.currency] || 0) + i.amount;
  }
  const overdue = refreshed.filter((i) => i.status === 'overdue');
  return {
    totalOutstanding: total,
    byCurrency,
    invoiceCount: refreshed.length,
    overdue: { count: overdue.length, amount: overdue.reduce((s, i) => s + i.amount, 0) },
  };
}

module.exports = {
  INVOICE_STATUSES,
  listInvoices,
  createInvoice,
  getInvoice,
  updateInvoice,
  sendInvoice,
  recordPayment,
  voidInvoice,
  outstanding,
};
