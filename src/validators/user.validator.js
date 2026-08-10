const Joi = require('joi');

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200),
  email: Joi.string().email(),
}).min(1); // at least one field must be provided

module.exports = { updateProfileSchema };
