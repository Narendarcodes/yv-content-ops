const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { authenticate, requireOrg, requirePermission } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { invoiceSchema, invoiceUpdateSchema, paymentSchema } = require('../validators/invoice.validator');

// --- Invoices (billing + payment status) ---
router.get('/:organizationId/invoices/outstanding', authenticate, requireOrg('organizationId'), requirePermission('invoice.manage'), invoiceController.outstanding);
router.get('/:organizationId/invoices', authenticate, requireOrg('organizationId'), requirePermission('invoice.manage'), invoiceController.list);
router.post('/:organizationId/invoices', authenticate, requireOrg('organizationId'), requirePermission('invoice.manage'), validate(invoiceSchema), invoiceController.create);
router.get('/:organizationId/invoices/:invoiceId', authenticate, requireOrg('organizationId'), requirePermission('invoice.manage'), invoiceController.get);
router.patch('/:organizationId/invoices/:invoiceId', authenticate, requireOrg('organizationId'), requirePermission('invoice.manage'), validate(invoiceUpdateSchema), invoiceController.update);
router.post('/:organizationId/invoices/:invoiceId/send', authenticate, requireOrg('organizationId'), requirePermission('invoice.manage'), invoiceController.send);
router.post('/:organizationId/invoices/:invoiceId/pay', authenticate, requireOrg('organizationId'), requirePermission('invoice.manage'), validate(paymentSchema), invoiceController.recordPayment);
router.post('/:organizationId/invoices/:invoiceId/void', authenticate, requireOrg('organizationId'), requirePermission('invoice.manage'), invoiceController.voidInvoice);

module.exports = router;
