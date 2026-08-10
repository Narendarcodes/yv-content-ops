const Input = require('../models/input.model');
const Project = require('../models/project.model');
const bus = require('../events/hub');

async function assertProject(projectId) {
  const project = await Project.findById(projectId);
  if (!project) throw { status: 404, code: 'project_not_found', message: 'Project not found' };
  return project;
}

async function listInputs({ projectId, state }) {
  await assertProject(projectId);
  const q = { projectId };
  if (state) q.state = state;
  return Input.find(q).sort({ createdAt: 1 }).populate('owner', 'name email');
}

async function createInput({ projectId, title, description = '', owner = null, source = '', requestedBy }) {
  await assertProject(projectId);
  const input = new Input({ projectId, title, description, owner, source, requestedBy, state: 'requested' });
  await input.save();
  await bus.emitAsync('input.requested', { projectId, input });
  return input;
}

async function updateInputState({ projectId, inputId, state, assetRef = '', actorId }) {
  await assertProject(projectId);
  const input = await Input.findOne({ _id: inputId, projectId });
  if (!input) throw { status: 404, code: 'input_not_found', message: 'Input not found' };
  input.state = state;
  if (state === 'received') {
    input.receivedAt = new Date();
    if (assetRef) input.assetRef = assetRef;
  }
  await input.save();
  await bus.emitAsync('input.updated', { projectId, input, actorId, state });
  return input;
}

module.exports = { listInputs, createInput, updateInputState };
