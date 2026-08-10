const metricsService = require('../services/metrics.service');

async function list(req, res, next) {
  try {
    const { id } = req.params;
    const metrics = await metricsService.listMetrics({ projectId: id });
    res.json({ data: metrics });
  } catch (err) {
    next(err);
  }
}

async function record(req, res, next) {
  try {
    const { id } = req.params;
    const { publicationId, metric, value, unit } = req.body;
    const m = await metricsService.recordMetric({
      projectId: id,
      publicationId: publicationId || null,
      metric,
      value,
      unit: unit || '',
      recordedBy: req.user._id,
    });
    res.status(201).json({ data: m });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, record };
