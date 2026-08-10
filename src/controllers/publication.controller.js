const publicationService = require('../services/publication.service');

async function list(req, res, next) {
  try {
    const { id } = req.params;
    const { limit, skip } = req.query;
    const result = await publicationService.listPublications({
      projectId: id,
      limit: parseInt(limit, 10) || 100,
      skip: parseInt(skip, 10) || 0,
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function record(req, res, next) {
  try {
    const { id } = req.params;
    const { platform, postUrl, postId } = req.body;
    const pub = await publicationService.recordPublication({
      projectId: id,
      platform,
      postUrl: postUrl || '',
      postId: postId || '',
      publishedBy: req.user._id,
    });
    res.status(201).json({ data: pub });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, record };
