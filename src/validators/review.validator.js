const Joi = require('joi');

const reviewLockSchema = Joi.object({
  versionId: Joi.string().hex().length(24).required(),
});

const reviewSummarizeSchema = Joi.object({
  versionId: Joi.string().hex().length(24).allow(null, ''),
});

module.exports = { reviewLockSchema, reviewSummarizeSchema };
