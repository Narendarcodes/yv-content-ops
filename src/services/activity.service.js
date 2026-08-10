const ActivityEvent = require('../models/activityEvent.model');

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

module.exports = { recordActivity, listActivity };
