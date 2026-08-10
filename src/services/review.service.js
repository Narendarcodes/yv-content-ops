const Project = require('../models/project.model');
const ProjectVersion = require('../models/projectVersion.model');
const Comment = require('../models/comment.model');
const RevisionRequest = require('../models/revisionRequest.model');
const bus = require('../events/hub');

async function assertProject(projectId) {
  const project = await Project.findById(projectId);
  if (!project) throw { status: 404, code: 'project_not_found', message: 'Project not found' };
  return project;
}

async function assertVersion(projectId, versionId) {
  const v = await ProjectVersion.findOne({ _id: versionId, projectId });
  if (!v) throw { status: 404, code: 'version_not_found', message: 'Version not found' };
  return v;
}

async function nextRevisionNumber(projectId) {
  const last = await RevisionRequest.findOne({ projectId }).sort({ revisionNumber: -1 });
  return last ? last.revisionNumber + 1 : 1;
}

/**
 * Summarize review feedback for a version — groups unresolved comments by
 * author and renders an action-oriented summary. Deterministic, rule-based;
 * designed to be swapped for an LLM summarizer later without changing the API.
 */
async function summarizeReview({ projectId, versionId = null }) {
  await assertProject(projectId);
  const q = { projectId, resolved: false };
  if (versionId) {
    await assertVersion(projectId, versionId);
    q.versionId = versionId;
  }
  const comments = await Comment.find(q).sort({ createdAt: 1 }).populate('author', 'name email');

  const byVersion = {};
  for (const c of comments) {
    const key = c.versionId ? c.versionId.toString() : 'general';
    if (!byVersion[key]) byVersion[key] = [];
    byVersion[key].push(c);
  }

  const sections = Object.keys(byVersion)
    .sort()
    .map((key) => ({
      versionId: key === 'general' ? null : key,
      commentCount: byVersion[key].length,
      comments: byVersion[key].map((c) => ({
        commentId: c._id,
        author: c.author ? { id: c.author._id, name: c.author.name } : null,
        body: c.body,
        createdAt: c.createdAt,
      })),
    }));

  const total = comments.length;
  const actionItems = [];
  for (const c of comments) {
    const t = (c.body || '').toLowerCase();
    if (/(please|can you|can we|could you|need to|should|fix|change|update|replace|add|remove|keep|swap|tighten|cool|make sure|hold)/.test(t)) {
      actionItems.push({
        commentId: c._id,
        versionId: c.versionId,
        body: c.body,
        requestedBy: c.author ? c.author.name : null,
      });
    }
  }

  return {
    projectId,
    versionId: versionId || null,
    totalComments: total,
    unresolvedComments: total,
    actionItems,
    sections,
    generatedBy: 'rule-based-summarizer', // swap for an LLM integration later
  };
}

/**
 * Lock review feedback for a version — Fluit's "lock feedback" step.
 * Converts unresolved comments into the scope of the next revision request
 * and marks the comments as resolved (locked into the scope).
 */
async function lockReview({ projectId, versionId, actorId }) {
  await assertProject(projectId);
  await assertVersion(projectId, versionId);

  const comments = await Comment.find({ projectId, versionId, resolved: false }).sort({ createdAt: 1 });
  if (comments.length === 0) {
    throw { status: 400, code: 'no_feedback', message: 'No unresolved feedback to lock for this version' };
  }

  const scopeItems = comments.map((c) => ({ commentId: c._id, author: c.author, body: c.body }));
  const summary = await summarizeReview({ projectId, versionId });
  const reason =
    `Review locked on version ${versionId}. ${summary.totalComments} feedback item(s) converted into revision scope.` +
    (summary.actionItems.length
      ? ` Action items: ${summary.actionItems.map((a) => `"${a.body}"`).join('; ')}`
      : '');

  const revision = new RevisionRequest({
    projectId,
    revisionNumber: await nextRevisionNumber(projectId),
    reason,
    sourceVersionId: versionId,
    requester: actorId,
    status: 'requested',
    source: 'review_lock',
    scopeItems,
  });
  await revision.save();

  // Lock the comments into the scope
  await Comment.updateMany(
    { _id: { $in: comments.map((c) => c._id) } },
    { $set: { resolved: true } }
  );

  await bus.emitAsync('review.locked', { projectId, versionId, revision, actorId, scopeItems });
  return { revision, lockedCommentCount: scopeItems.length, scopeItems };
}

module.exports = { summarizeReview, lockReview };
