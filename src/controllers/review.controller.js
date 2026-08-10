const reviewService = require('../services/review.service');

async function summarize(req, res, next) {
  try {
    const { id } = req.params;
    const { versionId } = req.body || {};
    const summary = await reviewService.summarizeReview({ projectId: id, versionId: versionId || null });
    res.json({ data: summary });
  } catch (err) {
    next(err);
  }
}

async function lock(req, res, next) {
  try {
    const { id } = req.params;
    const { versionId } = req.body || {};
    if (!versionId) {
      return res.status(400).json({ error: { code: 'missing_version', message: 'versionId is required to lock a review' } });
    }
    const result = await reviewService.lockReview({ projectId: id, versionId, actorId: req.user._id });
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { summarize, lock };
