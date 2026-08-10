const Joi = require('joi');

const briefSchema = Joi.object({
  goal: Joi.string().max(5000).allow('', null),
  targetAudience: Joi.string().max(2000).allow('', null),
  videoType: Joi.string().max(200).allow('', null),
  references: Joi.array().items(Joi.string().max(2000)).default([]),
  deliverables: Joi.array().items(Joi.string().max(500)).default([]),
  deadline: Joi.date().iso().allow(null),
  brandGuidelines: Joi.string().max(10000).allow('', null),
  specialInstructions: Joi.string().max(10000).allow('', null),
});

module.exports = { briefSchema };
