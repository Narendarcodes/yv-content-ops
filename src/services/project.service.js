const Project = require('../models/project.model');
const ProjectVersion = require('../models/projectVersion.model');
const Input = require('../models/input.model');
const bus = require('../events/hub');
const storage = require('../storage');

const ALLOWED_TRANSITIONS = {
  IDEA: ['APPROVED_CONCEPT', 'ASSIGNED', 'CANCELLED'],
  APPROVED_CONCEPT: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['WAITING_FOR_INPUTS', 'IN_PROGRESS', 'CANCELLED'],
  WAITING_FOR_INPUTS: ['INPUTS_READY', 'CANCELLED'],
  INPUTS_READY: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['FIRST_DRAFT_SUBMITTED', 'CANCELLED'],
  FIRST_DRAFT_SUBMITTED: ['UNDER_REVIEW', 'REVISION_REQUESTED'],
  UNDER_REVIEW: ['REVISION_REQUESTED', 'APPROVED'],
  REVISION_REQUESTED: ['REVISION_IN_PROGRESS'],
  REVISION_IN_PROGRESS: ['REVISION_SUBMITTED'],
  REVISION_SUBMITTED: ['UNDER_REVIEW', 'APPROVED'],
  APPROVED: ['SCHEDULED'],
  SCHEDULED: ['PUBLISHED'],
  PUBLISHED: ['CLOSED'],
  CANCELLED: ['CLOSED'],
  CLOSED: [],
};

const VALID_TYPES = ['concept', 'experiment', 'revision', 'production', 'content'];

async function getProject({ projectId, organizationId }) {
  const project = await Project.findOne({ _id: projectId, organizationId })
    .populate('creator', 'name email')
    .populate('assignee', 'name email');
  if (!project) throw { status: 404, code: 'project_not_found', message: 'Project not found' };
  return project;
}

async function listProjects({ organizationId, status, assignee, search, limit = 50, skip = 0, sort = '-createdAt' }) {
  const q = { organizationId };
  if (status) q.status = status;
  if (assignee) q.assignee = assignee;
  if (search) q.title = { $regex: search, $options: 'i' };
  const [items, total] = await Promise.all([
    Project.find(q)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('creator', 'name email')
      .populate('assignee', 'name email'),
    Project.countDocuments(q),
  ]);
  return { items, total, limit, skip };
}

async function createProject({ organizationId, title, description, creatorId, type = 'content' }) {
  if (!VALID_TYPES.includes(type)) {
    throw { status: 400, code: 'invalid_type', message: `Project type must be one of: ${VALID_TYPES.join(', ')}` };
  }
  const project = new Project({ organizationId, title, description, creator: creatorId, type });
  await project.save();
  await bus.emitAsync('project.created', { projectId: project._id, actorId: creatorId, project });
  return project;
}

async function transitionProject({ projectId, organizationId, newStatus, actorId }) {
  const project = await Project.findOne({ _id: projectId, organizationId });
  if (!project) throw { status: 404, code: 'project_not_found', message: 'Project not found' };
  const allowed = ALLOWED_TRANSITIONS[project.status] || [];
  if (!allowed.includes(newStatus)) {
    throw { status: 400, code: 'invalid_transition', message: `Cannot transition from ${project.status} to ${newStatus}` };
  }
  const from = project.status;
  project.status = newStatus;
  await project.save();
  await bus.emitAsync('project.transitioned', { projectId, from, to: newStatus, actorId });
  return project;
}

async function assignProject({ projectId, organizationId, assigneeId, actorId }) {
  const project = await Project.findOne({ _id: projectId, organizationId });
  if (!project) throw { status: 404, code: 'project_not_found', message: 'Project not found' };
  project.assignee = assigneeId;
  project.assignedAt = new Date();
  if (project.status === 'IDEA' || project.status === 'APPROVED_CONCEPT') {
    project.status = 'ASSIGNED';
  }
  await project.save();
  await bus.emitAsync('project.assigned', { projectId, assigneeId, actorId });
  return project;
}

async function getVersions({ projectId, organizationId, limit = 100, skip = 0 }) {
  await getProject({ projectId, organizationId });
  const [items, total] = await Promise.all([
    ProjectVersion.find({ projectId })
      .sort({ versionNumber: -1 })
      .skip(skip)
      .limit(limit)
      .populate('uploader', 'name email'),
    ProjectVersion.countDocuments({ projectId }),
  ]);
  return { items, total, limit, skip };
}

async function addVersion({ projectId, organizationId, uploaderId, metadata = {}, changeSummary = '', files = [] }) {
  await getProject({ projectId, organizationId });
  const last = await ProjectVersion.findOne({ projectId }).sort({ versionNumber: -1 }).limit(1);
  const next = last ? last.versionNumber + 1 : 1;
  const pv = new ProjectVersion({ projectId, versionNumber: next, uploader: uploaderId, metadata, changeSummary, files });
  await pv.save();

  const project = await Project.findOne({ _id: projectId, organizationId });
  if (project) {
    const before = project.status;
    if (project.status === 'IN_PROGRESS') {
      project.status = 'FIRST_DRAFT_SUBMITTED';
    } else if (project.status === 'REVISION_IN_PROGRESS') {
      project.status = 'REVISION_SUBMITTED';
    }
    if (project.status !== before) await project.save();
  }

  await bus.emitAsync('version.uploaded', { projectId, version: pv, uploaderId });
  return pv;
}

async function approveVersion({ projectId, organizationId, versionId, approverId }) {
  const project = await Project.findOne({ _id: projectId, organizationId });
  if (!project) throw { status: 404, code: 'project_not_found', message: 'Project not found' };
  const version = await ProjectVersion.findOne({ _id: versionId, projectId });
  if (!version) throw { status: 404, code: 'version_not_found', message: 'Version not found' };
  project.approvedVersionId = version._id;
  project.approvedBy = approverId;
  project.approvedAt = new Date();
  project.status = 'APPROVED';
  await project.save();
  await bus.emitAsync('project.approved', { projectId, versionId, approverId });
  return project;
}

async function checkInputsReady(projectId) {
  const project = await Project.findById(projectId);
  if (!project) return;
  const [requested, total] = await Promise.all([
    Input.countDocuments({ projectId, state: { $ne: 'received' } }),
    Input.countDocuments({ projectId }),
  ]);
  if (total > 0 && requested === 0) {
    if (project.status === 'WAITING_FOR_INPUTS') {
      project.status = 'INPUTS_READY';
      await project.save();
      await bus.emitAsync('project.transitioned', {
        projectId,
        from: 'WAITING_FOR_INPUTS',
        to: 'INPUTS_READY',
        actorId: null,
      });
    }
  }
}

async function saveVersionFile({ projectId, versionId, fileBuffer, filename, mimeType, uploaderId }) {
  const version = await ProjectVersion.findOne({ _id: versionId, projectId });
  if (!version) throw { status: 404, code: 'version_not_found', message: 'Version not found' };
  const { storageRef, size } = await storage.saveFile(fileBuffer, { filename, mimeType });
  version.files.push({ filename, mimeType, size, storageRef, uploadedBy: uploaderId });
  await version.save();
  return version;
}

module.exports = {
  ALLOWED_TRANSITIONS,
  VALID_TYPES,
  getProject,
  listProjects,
  createProject,
  transitionProject,
  assignProject,
  getVersions,
  addVersion,
  approveVersion,
  checkInputsReady,
  saveVersionFile,
};
