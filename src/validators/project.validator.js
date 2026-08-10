const Joi = require('joi');
const { VALID_TYPES } = require('../services/project.service');

const createProjectSchema = Joi.object({
  organizationId: Joi.string().hex().length(24).required(),
  title: Joi.string().trim().min(1).max(300).required(),
  description: Joi.string().max(5000).allow('', null),
  type: Joi.string()
    .valid(...VALID_TYPES)
    .default('content'),
});

const listProjectsSchema = Joi.object({
  status: Joi.string().optional(),
  assignee: Joi.string().hex().length(24).optional(),
  search: Joi.string().max(200).optional(),
  limit: Joi.number().integer().min(1).max(200).default(50),
  skip: Joi.number().integer().min(0).default(0),
  sort: Joi.string().optional(),
});

const transitionSchema = Joi.object({
  status: Joi.string().required(),
});

const assignSchema = Joi.object({
  assigneeId: Joi.string().hex().length(24).required(),
});

const addVersionSchema = Joi.object({
  metadata: Joi.object().default({}),
  changeSummary: Joi.string().max(5000).allow('', null),
});

const approveSchema = Joi.object({
  versionId: Joi.string().hex().length(24).required(),
});

const scheduleSchema = Joi.object({
  scheduledAt: Joi.date().iso().required(),
});

const commentSchema = Joi.object({
  versionId: Joi.string().hex().length(24).allow(null, ''),
  parentId: Joi.string().hex().length(24).allow(null, ''),
  body: Joi.string().trim().min(1).max(10000).required(),
});

const revisionSchema = Joi.object({
  sourceVersionId: Joi.string().hex().length(24).allow(null, ''),
  reason: Joi.string().trim().min(1).max(5000).required(),
});

const revisionUpdateSchema = Joi.object({
  status: Joi.string().valid('in_progress', 'submitted', 'resolved').required(),
  resolvedVersionId: Joi.string().hex().length(24).allow(null, ''),
});

const publicationSchema = Joi.object({
  platform: Joi.string().trim().min(1).max(100).required(),
  postUrl: Joi.string().uri().allow('', null),
  postId: Joi.string().max(300).allow('', null),
});

const metricSchema = Joi.object({
  publicationId: Joi.string().hex().length(24).allow(null, ''),
  metric: Joi.string().trim().min(1).max(100).required(),
  value: Joi.number().required(),
  unit: Joi.string().max(50).allow('', null),
});

const inputSchema = Joi.object({
  title: Joi.string().trim().min(1).max(300).required(),
  description: Joi.string().max(5000).allow('', null),
  owner: Joi.string().hex().length(24).allow(null, ''),
  source: Joi.string().max(500).allow('', null),
});

const inputUpdateSchema = Joi.object({
  state: Joi.string().valid('requested', 'received', 'missing', 'blocked').required(),
  assetRef: Joi.string().max(500).allow('', null),
});

module.exports = {
  createProjectSchema,
  listProjectsSchema,
  transitionSchema,
  assignSchema,
  addVersionSchema,
  approveSchema,
  scheduleSchema,
  commentSchema,
  revisionSchema,
  revisionUpdateSchema,
  publicationSchema,
  metricSchema,
  inputSchema,
  inputUpdateSchema,
};
