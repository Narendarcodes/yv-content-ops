/**
 * Concepts: propose / list / approve / decline.
 * All routes require auth + org membership; approve additionally creates the
 * real project so an approved concept flows straight into the pipeline.
 */
const express = require('express');
// mergeParams: the :organizationId lives on the MOUNT path in app.js, not on
// this router - without it req.params.organizationId is undefined here.
const router = express.Router({ mergeParams: true });
const Concept = require('../models/concept.model');
const Project = require('../models/project.model');
const { authenticate, requireOrg } = require('../middleware/auth');
const logger = require('../utils/logger');

router.use(authenticate, requireOrg('organizationId'));

/** GET /organizations/:organizationId/concepts - open + decided, newest first. */
router.get('/', async (req, res, next) => {
  try {
    const concepts = await Concept.find({ organizationId: req.params.organizationId })
      .sort({ createdAt: -1 })
      .populate('proposer', 'name email')
      .lean();
    res.json({
      data: concepts.map((c) => ({
        id: String(c._id),
        title: c.title,
        description: c.description,
        type: c.type,
        status: c.status,
        proposer: c.proposer ? String(c.proposer._id || c.proposer) : null,
        proposerName: c.proposer && typeof c.proposer === 'object' ? c.proposer.name : null,
        approvedProjectId: c.approvedProjectId ? String(c.approvedProjectId) : null,
        createdAt: c.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

/** POST /organizations/:organizationId/concepts - propose a new idea. */
router.post('/', async (req, res, next) => {
  try {
    const { title, description, type } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: { message: 'Title is required' } });
    }
    if (!description || !String(description).trim()) {
      return res.status(400).json({ error: { message: 'Description is required' } });
    }
    const concept = await Concept.create({
      organizationId: req.params.organizationId,
      title: String(title).trim().slice(0, 140),
      description: String(description).trim().slice(0, 2000),
      type: ['New Concept', 'Experiment', 'Revision'].includes(type) ? type : 'New Concept',
      proposer: req.user._id,
    });
    res.status(201).json({ data: { id: String(concept._id), status: concept.status } });
  } catch (err) {
    next(err);
  }
});

/** PATCH /concepts/:conceptId/approve - mark approved and create the project. */
router.patch('/:conceptId/approve', async (req, res, next) => {
  try {
    const concept = await Concept.findOne({ _id: req.params.conceptId, organizationId: req.params.organizationId });
    if (!concept) return res.status(404).json({ error: { message: 'Concept not found' } });
    if (concept.status !== 'IDEA') {
      return res.status(409).json({ error: { message: `Concept already ${concept.status.toLowerCase()}` } });
    }
    const project = await Project.create({
      organizationId: concept.organizationId,
      title: concept.title,
      description: concept.description,
      type: concept.type,
      status: 'IDEA',
      creator: req.user._id,
    });
    concept.status = 'APPROVED';
    concept.approvedProjectId = project._id;
    await concept.save();
    logger.info({ conceptId: String(concept._id), projectId: String(project._id) }, 'concept approved -> project created');
    res.json({ data: { id: String(concept._id), status: concept.status, projectId: String(project._id) } });
  } catch (err) {
    next(err);
  }
});

/** PATCH /concepts/:conceptId/decline - mark declined (kept for record). */
router.patch('/:conceptId/decline', async (req, res, next) => {
  try {
    const concept = await Concept.findOneAndUpdate(
      { _id: req.params.conceptId, organizationId: req.params.organizationId },
      { status: 'DECLINED' },
      { new: true },
    );
    if (!concept) return res.status(404).json({ error: { message: 'Concept not found' } });
    res.json({ data: { id: String(concept._id), status: concept.status } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
