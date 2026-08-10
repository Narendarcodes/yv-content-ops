const Task = require('../models/task.model');
const Project = require('../models/project.model');
const User = require('../models/user.model');
const bus = require('../events/hub');

const TASK_STATUSES = ['todo', 'in_progress', 'in_review', 'done'];

async function assertProject(projectId) {
  const project = await Project.findById(projectId);
  if (!project) throw { status: 404, code: 'project_not_found', message: 'Project not found' };
  return project;
}

async function assertAssigneeExists(assigneeId) {
  if (!assigneeId) return;
  const u = await User.findById(assigneeId);
  if (!u) throw { status: 404, code: 'assignee_not_found', message: 'Assignee not found' };
}

async function listTasks({ projectId, status, assignee, limit = 100, skip = 0 }) {
  await assertProject(projectId);
  const q = { projectId };
  if (status) q.status = status;
  if (assignee) q.assignee = assignee;
  const [items, total] = await Promise.all([
    Task.find(q).sort({ dueDate: 1, createdAt: -1 }).skip(skip).limit(limit).populate('assignee', 'name email'),
    Task.countDocuments(q),
  ]);
  return { items, total, limit, skip };
}

async function createTask({ projectId, title, description = '', priority = 'medium', assignee = null, dueDate = null, createdBy }) {
  await assertProject(projectId);
  await assertAssigneeExists(assignee);
  const task = new Task({ projectId, title, description, priority, assignee, dueDate, createdBy });
  await task.save();
  await bus.emitAsync('task.created', { projectId, task, actorId: createdBy });
  return task;
}

async function getTask({ projectId, taskId }) {
  const task = await Task.findOne({ _id: taskId, projectId }).populate('assignee', 'name email');
  if (!task) throw { status: 404, code: 'task_not_found', message: 'Task not found' };
  return task;
}

async function updateTask({ projectId, taskId, actorId, fields = {} }) {
  const task = await Task.findOne({ _id: taskId, projectId });
  if (!task) throw { status: 404, code: 'task_not_found', message: 'Task not found' };
  const changes = {};
  if (fields.title !== undefined) changes.title = fields.title;
  if (fields.description !== undefined) changes.description = fields.description;
  if (fields.priority !== undefined) changes.priority = fields.priority;
  if (fields.dueDate !== undefined) changes.dueDate = fields.dueDate || null;
  if (fields.assignee !== undefined) {
    await assertAssigneeExists(fields.assignee);
    changes.assignee = fields.assignee;
  }
  Object.assign(task, changes);
  await task.save();
  await bus.emitAsync('task.updated', { projectId, task, actorId, changes });
  return task;
}

async function setTaskStatus({ projectId, taskId, status, actorId }) {
  if (!TASK_STATUSES.includes(status)) {
    throw { status: 400, code: 'invalid_status', message: `Status must be one of: ${TASK_STATUSES.join(', ')}` };
  }
  const task = await Task.findOne({ _id: taskId, projectId });
  if (!task) throw { status: 404, code: 'task_not_found', message: 'Task not found' };
  const from = task.status;
  task.status = status;
  task.completedAt = status === 'done' ? new Date() : null;
  await task.save();
  await bus.emitAsync('task.status_changed', { projectId, task, from, to: status, actorId });
  return task;
}

async function deleteTask({ projectId, taskId, actorId }) {
  const task = await Task.findOneAndDelete({ _id: taskId, projectId });
  if (!task) throw { status: 404, code: 'task_not_found', message: 'Task not found' };
  await bus.emitAsync('task.deleted', { projectId, taskId, actorId });
  return { deleted: true };
}

module.exports = {
  TASK_STATUSES,
  listTasks,
  createTask,
  getTask,
  updateTask,
  setTaskStatus,
  deleteTask,
};
