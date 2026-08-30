const express = require('express');
const multer = require('multer');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const inputController = require('../controllers/input.controller');
const commentController = require('../controllers/comment.controller');
const revisionController = require('../controllers/revision.controller');
const publicationController = require('../controllers/publication.controller');
const metricsController = require('../controllers/metrics.controller');
const activityController = require('../controllers/activity.controller');
const taskController = require('../controllers/task.controller');
const briefController = require('../controllers/brief.controller');
const reviewController = require('../controllers/review.controller');
const chatController = require('../controllers/chat.controller');
const { authenticate, requirePermission, requireProjectMember } = require('../middleware/auth');
const fileStreamController = require('../controllers/fileStream.controller');
const { validate } = require('../middleware/validate');
const {
  createProjectSchema,
  transitionSchema,
  assignSchema,
  addVersionSchema,
  approveSchema,
  scheduleSchema,
  commentSchema,
  revisionSchema,
  revisionUpdateSchema,
  publicationSchema,
  metricSchema,
  inputSchema,
  inputUpdateSchema,
} = require('../validators/project.validator');
const { taskSchema, taskUpdateSchema, taskStatusSchema } = require('../validators/task.validator');
const { briefSchema } = require('../validators/brief.validator');
const { reviewLockSchema, reviewSummarizeSchema } = require('../validators/review.validator');
const { channelSchema, messageSchema } = require('../validators/chat.validator');

// in-memory multer: buffers file in memory, then handed to storage adapter
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB cap
});

// --- Project CRUD ---
router.post('/', authenticate, requirePermission('project.create'), validate(createProjectSchema), projectController.create);
router.get('/', authenticate, requirePermission('project.view'), projectController.list);
router.get('/:id', authenticate, requirePermission('project.view'), projectController.get);

// --- Workflow ---
router.post('/:id/transition', authenticate, requirePermission('project.transition'), validate(transitionSchema), projectController.transition);
router.post('/:id/assign', authenticate, requirePermission('project.assign'), validate(assignSchema), projectController.assign);
router.post('/:id/approve', authenticate, requirePermission('project.approve'), validate(approveSchema), projectController.approve);
router.post('/:id/schedule', authenticate, requirePermission('project.schedule'), validate(scheduleSchema), projectController.schedule);

// --- Versions ---
router.get('/:id/versions', authenticate, requirePermission('project.view'), projectController.getVersions);
router.post('/:id/versions', authenticate, requirePermission('project.upload_version'), validate(addVersionSchema), projectController.addVersion);
router.post('/:id/versions/:versionId/files', authenticate, requirePermission('project.upload_version'), upload.single('file'), projectController.uploadFile);
// Stream/download a stored version file (Range-aware for video seeking).
router.get('/:id/versions/:versionId/files/:fileId', authenticate, requireProjectMember(), fileStreamController.streamVersionFile);

// --- Inputs ---
router.get('/:id/inputs', authenticate, requirePermission('project.view'), inputController.list);
router.post('/:id/inputs', authenticate, requirePermission('project.transition'), validate(inputSchema), inputController.create);
router.patch('/:id/inputs/:inputId', authenticate, requirePermission('project.transition'), validate(inputUpdateSchema), inputController.update);

// --- Comments ---
router.get('/:id/comments', authenticate, requirePermission('project.view'), commentController.list);
router.post('/:id/comments', authenticate, requirePermission('project.comment'), validate(commentSchema), commentController.add);
router.patch('/:id/comments/:commentId', authenticate, requirePermission('project.comment'), commentController.resolve);

// --- Revisions ---
router.get('/:id/revisions', authenticate, requirePermission('project.view'), revisionController.list);
router.post('/:id/revisions', authenticate, requirePermission('project.revision'), validate(revisionSchema), revisionController.request);
router.patch('/:id/revisions/:revisionId', authenticate, requirePermission('project.revision'), validate(revisionUpdateSchema), revisionController.update);

// --- Publications ---
router.get('/:id/publications', authenticate, requirePermission('project.view'), publicationController.list);
router.post('/:id/publications', authenticate, requirePermission('project.publish'), validate(publicationSchema), publicationController.record);

// --- Metrics ---
router.get('/:id/metrics', authenticate, requirePermission('project.view'), metricsController.list);
router.post('/:id/metrics', authenticate, requirePermission('project.metrics'), validate(metricSchema), metricsController.record);

// --- Tasks (kanban) ---
router.get('/:id/tasks', authenticate, requirePermission('project.view'), taskController.list);
router.post('/:id/tasks', authenticate, requirePermission('task.create'), validate(taskSchema), taskController.create);
router.get('/:id/tasks/:taskId', authenticate, requirePermission('project.view'), taskController.get);
router.patch('/:id/tasks/:taskId', authenticate, requirePermission('task.update'), validate(taskUpdateSchema), taskController.update);
router.delete('/:id/tasks/:taskId', authenticate, requirePermission('task.update'), taskController.remove);
router.post('/:id/tasks/:taskId/status', authenticate, requirePermission('task.update'), validate(taskStatusSchema), taskController.setStatus);

// --- Brief ---
router.get('/:id/brief', authenticate, requirePermission('project.view'), briefController.get);
router.put('/:id/brief', authenticate, requirePermission('brief.manage'), validate(briefSchema), briefController.upsert);

// --- Reviews (feedback lock + summary) ---
router.post('/:id/reviews/summarize', authenticate, requirePermission('project.view'), validate(reviewSummarizeSchema), reviewController.summarize);
router.post('/:id/reviews/lock', authenticate, requirePermission('project.revision'), validate(reviewLockSchema), reviewController.lock);

// --- Chat ---
router.get('/:id/channels', authenticate, requirePermission('project.view'), chatController.listChannels);
router.post('/:id/channels', authenticate, requirePermission('chat.post'), validate(channelSchema), chatController.createChannel);
router.get('/:id/channels/:channelId/messages', authenticate, requirePermission('project.view'), chatController.listMessages);
router.post('/:id/channels/:channelId/messages', authenticate, requirePermission('chat.post'), validate(messageSchema), chatController.postMessage);

// --- Activity ---
router.get('/:id/activity', authenticate, requirePermission('project.view'), activityController.list);

module.exports = router;
