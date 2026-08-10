const Publication = require('../models/publication.model');
const Project = require('../models/project.model');
const ProjectVersion = require('../models/projectVersion.model');
const bus = require('../events/hub');

async function assertProject(projectId) {
  const project = await Project.findById(projectId);
  if (!project) throw { status: 404, code: 'project_not_found', message: 'Project not found' };
  return project;
}

async function scheduleProject({ projectId, scheduledAt, actorId }) {
  const project = await assertProject(projectId);
  if (!project.approvedVersionId) {
    throw { status: 400, code: 'not_approved', message: 'Cannot schedule a project without an approved version' };
  }
  project.scheduledAt = new Date(scheduledAt);
  if (project.status === 'APPROVED') {
    project.status = 'SCHEDULED';
  }
  await project.save();
  await bus.emitAsync('project.scheduled', { projectId, scheduledAt: project.scheduledAt, actorId });
  return project;
}

async function listPublications({ projectId, limit = 100, skip = 0 }) {
  await assertProject(projectId);
  const [items, total] = await Promise.all([
    Publication.find({ projectId }).sort({ publishedAt: -1 }).skip(skip).limit(limit),
    Publication.countDocuments({ projectId }),
  ]);
  return { items, total, limit, skip };
}

async function recordPublication({ projectId, platform, postUrl = '', postId = '', publishedBy }) {
  const project = await assertProject(projectId);
  if (!project.approvedVersionId) {
    throw { status: 400, code: 'not_approved', message: 'Cannot publish without an approved version' };
  }
  const pub = new Publication({ projectId, platform, postUrl, postId, publishedBy });
  await pub.save();
  project.publishedAt = new Date();
  if (['APPROVED', 'SCHEDULED'].includes(project.status)) {
    project.status = 'PUBLISHED';
  }
  await project.save();
  await bus.emitAsync('project.published', { projectId, publication: pub, publishedBy });
  return pub;
}

async function getApprovedVersion(projectId) {
  const project = await assertProject(projectId);
  if (!project.approvedVersionId) return null;
  return ProjectVersion.findById(project.approvedVersionId);
}

module.exports = { scheduleProject, listPublications, recordPublication, getApprovedVersion };
