const revisionService = require('../services/revision.service');

async function list(req, res, next) {
  try {
    const { id } = req.params;
    const revisions = await revisionService.listRevisions({ projectId: id });
    res.json({ data: revisions });
  } catch (err) {
    next(err);
  }
}

async function request(req, res, next) {
  try {
    const { id } = req.params;
    const { sourceVersionId, reason } = req.body;
    const revision = await revisionService.requestRevision({
      projectId: id,
      sourceVersionId: sourceVersionId || null,
      reason,
      requester: req.user._id,
    });
    res.status(201).json({ data: revision });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id, revisionId } = req.params;
    const { status, resolvedVersionId } = req.body;
    const revision = await revisionService.updateRevision({
      revisionId,
      projectId: id,
      status,
      submitter: req.user._id,
      resolvedVersionId: resolvedVersionId || null,
    });
    res.json({ data: revision });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, request, update };
