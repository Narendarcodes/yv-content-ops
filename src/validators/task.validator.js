const Joi = require('joi');

const taskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(300).required(),
  description: Joi.string().max(10000).allow('', null),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  assignee: Joi.string().hex().length(24).allow(null, ''),
  dueDate: Joi.date().iso().allow(null),
});

const taskUpdateSchema = Joi.object({
  title: Joi.string().trim().min(1).max(300),
  description: Joi.string().max(10000).allow('', null),
  priority: Joi.string().valid('low', 'medium', 'high'),
  assignee: Joi.string().hex().length(24).allow(null, ''),
  dueDate: Joi.date().iso().allow(null),
}).min(1);

const taskStatusSchema = Joi.object({
  status: Joi.string().valid('todo', 'in_progress', 'in_review', 'done').required(),
});

module.exports = { taskSchema, taskUpdateSchema, taskStatusSchema };
