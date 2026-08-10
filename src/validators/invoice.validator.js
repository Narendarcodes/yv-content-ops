const Joi = require('joi');

const invoiceSchema = Joi.object({
  projectId: Joi.string().hex().length(24).allow(null, ''),
  number: Joi.string().trim().min(1).max(100).required(),
  amount: Joi.number().min(0).required(),
  currency: Joi.string().max(10).default('USD'),
  dueDate: Joi.date().iso().allow(null),
  note: Joi.string().max(5000).allow('', null),
});

const invoiceUpdateSchema = Joi.object({
  projectId: Joi.string().hex().length(24).allow(null, ''),
  number: Joi.string().trim().min(1).max(100),
  amount: Joi.number().min(0),
  currency: Joi.string().max(10),
  dueDate: Joi.date().iso().allow(null),
  note: Joi.string().max(5000).allow('', null),
}).min(1);

const paymentSchema = Joi.object({
  paymentMethod: Joi.string().max(100).allow('', null),
  paidAt: Joi.date().iso().allow(null),
});

module.exports = { invoiceSchema, invoiceUpdateSchema, paymentSchema };
