const invoiceService = require('../services/invoice.service');

async function list(req, res, next) {
  try {
    const { organizationId } = req.params;
    const { status, limit, skip } = req.query;
    const result = await invoiceService.listInvoices({
      organizationId,
      status,
      limit: parseInt(limit, 10) || 100,
      skip: parseInt(skip, 10) || 0,
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { organizationId } = req.params;
    const { projectId, number, amount, currency, dueDate, note } = req.body;
    const invoice = await invoiceService.createInvoice({
      organizationId,
      projectId: projectId || null,
      number,
      amount,
      currency,
      dueDate: dueDate || null,
      note,
      createdBy: req.user._id,
    });
    res.status(201).json({ data: invoice });
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const { organizationId, invoiceId } = req.params;
    const invoice = await invoiceService.getInvoice({ organizationId, invoiceId });
    res.json({ data: invoice });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { organizationId, invoiceId } = req.params;
    const invoice = await invoiceService.updateInvoice({
      organizationId,
      invoiceId,
      actorId: req.user._id,
      fields: req.body,
    });
    res.json({ data: invoice });
  } catch (err) {
    next(err);
  }
}

async function send(req, res, next) {
  try {
    const { organizationId, invoiceId } = req.params;
    const invoice = await invoiceService.sendInvoice({ organizationId, invoiceId, actorId: req.user._id });
    res.json({ data: invoice });
  } catch (err) {
    next(err);
  }
}

async function recordPayment(req, res, next) {
  try {
    const { organizationId, invoiceId } = req.params;
    const { paymentMethod, paidAt } = req.body;
    const invoice = await invoiceService.recordPayment({
      organizationId,
      invoiceId,
      actorId: req.user._id,
      paymentMethod: paymentMethod || '',
      paidAt: paidAt || null,
    });
    res.json({ data: invoice });
  } catch (err) {
    next(err);
  }
}

async function voidInvoice(req, res, next) {
  try {
    const { organizationId, invoiceId } = req.params;
    const invoice = await invoiceService.voidInvoice({ organizationId, invoiceId, actorId: req.user._id });
    res.json({ data: invoice });
  } catch (err) {
    next(err);
  }
}

async function outstanding(req, res, next) {
  try {
    const { organizationId } = req.params;
    const result = await invoiceService.outstanding({ organizationId });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, get, update, send, recordPayment, voidInvoice, outstanding };
