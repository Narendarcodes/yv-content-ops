const Joi = require('joi');

const channelSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  type: Joi.string().valid('channel', 'dm').default('channel'),
  members: Joi.array().items(Joi.string().hex().length(24)).default([]),
});

const messageSchema = Joi.object({
  body: Joi.string().trim().min(1).max(10000).required(),
  parentId: Joi.string().hex().length(24).allow(null, ''),
  attachments: Joi.array().items(Joi.string().max(2000)).default([]),
});

module.exports = { channelSchema, messageSchema };
