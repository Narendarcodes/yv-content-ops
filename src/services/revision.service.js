const RevisionRequest = require('../models/revisionRequest.model');
const Project = require('../models/project.model');
const ProjectVersion = require('../models/projectVersion.model');
const bus = require('../events/hub');

async function assertProject(projectId) {
  const project = await Project.findById(projectId);
  if (!project) throw { status: 404, code: 'project_not_found', message: 'Project not found' };
  return project;
}

async function nextRevisionNumber(projectId) {
  const last = await RevisionRequest.findOne({ projectId }).sort({ revisionNumber: -1 }).limit(1);
  return last ? last.revisionNumber + 1 : 1;
}

async function listRevisions({ projectId }) {
  await assertProject(projectId);
  return RevisionRequest.find({ projectId }).sort({ revisionNumber: -1 });
}

async function requestRevision({ projectId, sourceVersionId = null, reason, requester }) {
  const project = await assertProject(projectId);
  if (sourceVersionId) {
    const v = await ProjectVersion.findOne({ _id: sourceVersionId, projectId });
    if (!v) throw { status: 404, code: 'version_not_found', message: 'Source version not found' };
  }
  const revisionNumber = await nextRevisionNumber(projectId);
  const rr = new RevisionRequest({ projectId, revisionNumber, sourceVersionId, reason, requester, status: 'requested' });
  await rr.save();

  project.revisionCount += 1;
  // Only move to REVISION_REQUESTED if currently in a reviewable state
  if (['FIRST_DRAFT_SUBMITTED', 'UNDER_REVIEW', 'REVISION_SUBMITTED'].includes(project.status)) {
    project.status = 'REVISION_REQUESTED';
    await project.save();
  }
  await bus.emitAsync('revision.requested', { projectId, revision: rr, requester });
  return rr;
}

async function updateRevision({ revisionId, projectId, status, submitter = null, resolvedVersionId = null }) {
  const rr = await RevisionRequest.findOne({ _id: revisionId, projectId });
  if (!rr) throw { status: 404, code: 'revision_not_found', message: 'Revision request not found' };

  const project = await Project.findById(projectId);

  if (status === 'in_progress') {
    rr.status = 'in_progress';
    if (project && ['REVISION_REQUESTED'].includes(project.status)) {
      project.status = 'REVISION_IN_PROGRESS';
      await project.save();
    }
  } else if (status === 'submitted') {
    rr.status = 'submitted';
    rr.submitter = submitter;
    rr.submittedAt = new Date();
    if (resolvedVersionId) rr.resolvedVersionId = resolvedVersionId;
    if (project && ['REVISION_IN_PROGRESS'].includes(project.status)) {
      project.status = 'REVISION_SUBMITTED';
      await project.save();
    }
  } else if (status === 'resolved') {
    rr.status = 'resolved';
    rr.resolvedAt = new Date();
    if (resolvedVersionId) rr.resolvedVersionId = resolvedVersionId;
  } else {
    throw { status: 400, code: 'invalid_revision_status', message: 'Invalid revision status' };
  }

  await rr.save();
  await bus.emitAsync('revision.updated', { projectId, revision: rr, status, submitter });
  return rr;
}

module.exports = { listRevisions, requestRevision, updateRevision };
