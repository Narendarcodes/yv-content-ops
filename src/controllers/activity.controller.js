const activityService = require('../services/activity.service');

async function list(req, res, next) {
  try {
    const { id } = req.params;
    const { limit, skip } = req.query;
    const events = await activityService.listActivity({
      projectId: id,
      limit: parseInt(limit, 10) || 100,
      skip: parseInt(skip, 10) || 0,
    });
    res.json({ data: events });
  } catch (err) {
    next(err);
  }
}

/** Org-wide feed for the dashboard — events across all org projects, newest first. */
async function listOrg(req, res, next) {
  try {
    const { organizationId } = req.params;
    const { limit, skip } = req.query;
    const events = await activityService.listOrgActivity({
      organizationId,
      limit: Math.min(parseInt(limit, 10) || 20, 100),
      skip: parseInt(skip, 10) || 0,
    });
    res.json({ data: events });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, listOrg };
