const PerformanceMetric = require('../models/performanceMetric.model');
const Project = require('../models/project.model');
const bus = require('../events/hub');

async function assertProject(projectId) {
  const project = await Project.findById(projectId);
  if (!project) throw { status: 404, code: 'project_not_found', message: 'Project not found' };
  return project;
}

async function listMetrics({ projectId }) {
  await assertProject(projectId);
  return PerformanceMetric.find({ projectId }).sort({ recordedAt: -1 });
}

async function recordMetric({ projectId, publicationId = null, metric, value, unit = '', recordedBy }) {
  await assertProject(projectId);
  const m = new PerformanceMetric({ projectId, publicationId, metric, value, unit, recordedBy });
  await m.save();
  await bus.emitAsync('metric.recorded', { projectId, metric: m, recordedBy });
  return m;
}

module.exports = { listMetrics, recordMetric };
