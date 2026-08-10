const taskService = require('../services/task.service');

async function list(req, res, next) {
  try {
    const { id } = req.params;
    const { status, assignee, limit, skip } = req.query;
    const result = await taskService.listTasks({
      projectId: id,
      status,
      assignee,
      limit: parseInt(limit, 10) || 100,
      skip: parseInt(skip, 10) || 0,
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, priority, assignee, dueDate } = req.body;
    const task = await taskService.createTask({
      projectId: id,
      title,
      description,
      priority,
      assignee,
      dueDate,
      createdBy: req.user._id,
    });
    res.status(201).json({ data: task });
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const { id, taskId } = req.params;
    const task = await taskService.getTask({ projectId: id, taskId });
    res.json({ data: task });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id, taskId } = req.params;
    const task = await taskService.updateTask({ projectId: id, taskId, actorId: req.user._id, fields: req.body });
    res.json({ data: task });
  } catch (err) {
    next(err);
  }
}

async function setStatus(req, res, next) {
  try {
    const { id, taskId } = req.params;
    const { status } = req.body;
    const task = await taskService.setTaskStatus({ projectId: id, taskId, status, actorId: req.user._id });
    res.json({ data: task });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id, taskId } = req.params;
    const result = await taskService.deleteTask({ projectId: id, taskId, actorId: req.user._id });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, get, update, setStatus, remove };
