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

module.exports = { list };
