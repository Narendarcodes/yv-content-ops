const publicationService = require('../services/publication.service');

async function list(req, res, next) {
  try {
    const { id } = req.params;
    const pubs = await publicationService.listPublications({ projectId: id });
    res.json({ data: pubs });
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
