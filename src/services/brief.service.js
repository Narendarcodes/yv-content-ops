const Brief = require('../models/brief.model');
const Project = require('../models/project.model');
const bus = require('../events/hub');

async function assertProject(projectId) {
  const project = await Project.findById(projectId);
  if (!project) throw { status: 404, code: 'project_not_found', message: 'Project not found' };
  return project;
}

async function getBrief({ projectId }) {
  await assertProject(projectId);
  const brief = await Brief.findOne({ projectId });
  return brief || { projectId, exists: false };
}

async function upsertBrief({ projectId, submittedBy, fields }) {
  await assertProject(projectId);
  const existing = await Brief.findOne({ projectId });
  if (existing) {
    Object.assign(existing, fields);
    await existing.save();
    await bus.emitAsync('brief.updated', { projectId, brief: existing, actorId: submittedBy });
    return existing;
  }
  const brief = new Brief({ projectId, submittedBy, ...fields });
  await brief.save();
  await bus.emitAsync('brief.created', { projectId, brief, actorId: submittedBy });
  return brief;
}

module.exports = { getBrief, upsertBrief };
