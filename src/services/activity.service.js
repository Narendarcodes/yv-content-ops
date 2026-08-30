const ActivityEvent = require('../models/activityEvent.model');
const Project = require('../models/project.model');

async function recordActivity({ projectId, actor, action, entityType = '', entityId = null, metadata = {} }) {
  const ev = new ActivityEvent({ projectId, actor, action, entityType, entityId, metadata });
  await ev.save();
  return ev;
}

async function listActivity({ projectId, limit = 100, skip = 0 }) {
  return ActivityEvent.find({ projectId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('actor', 'name email');
}

/**
 * Org-wide feed: newest events across every project in the organization.
 * Used by the dashboard "Recent activity" card (real events, not
 * notifications). Membership is enforced by the route's requireOrg.
 */
async function listOrgActivity({ organizationId, limit = 20, skip = 0 }) {
  const projects = await Project.find({ organizationId }).select('_id').lean();
  const projectIds = projects.map((p) => p._id);
  if (projectIds.length === 0) return [];
  return ActivityEvent.find({ projectId: { $in: projectIds } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('actor', 'name email')
    .populate('projectId', 'title');
}

module.exports = { recordActivity, listActivity, listOrgActivity };
