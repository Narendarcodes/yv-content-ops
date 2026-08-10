const Joi = require('joi');

const contractSchema = Joi.object({
  projectId: Joi.string().hex().length(24).allow(null, ''),
  title: Joi.string().trim().min(1).max(300).required(),
  terms: Joi.string().max(100000).allow('', null),
  amount: Joi.number().min(0).default(0),
  currency: Joi.string().max(10).default('USD'),
  sentTo: Joi.string().max(300).allow('', null),
});

const contractUpdateSchema = Joi.object({
  projectId: Joi.string().hex().length(24).allow(null, ''),
  title: Joi.string().trim().min(1).max(300),
  terms: Joi.string().max(100000).allow('', null),
  amount: Joi.number().min(0),
  currency: Joi.string().max(10),
  sentTo: Joi.string().max(300).allow('', null),
}).min(1);

const contractSignSchema = Joi.object({
  signerName: Joi.string().trim().min(1).max(200).required(),
  signerEmail: Joi.string().email().max(300).required(),
});

module.exports = { contractSchema, contractUpdateSchema, contractSignSchema };
