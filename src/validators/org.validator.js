const Joi = require('joi');

const createOrgSchema = Joi.object({
  name: Joi.string().trim().min(1).max(300).required(),
  slug: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .lowercase()
    .pattern(/^[a-z0-9-]+$/)
    .required(),
});

module.exports = { createOrgSchema };
