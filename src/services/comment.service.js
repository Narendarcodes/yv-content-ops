const Comment = require('../models/comment.model');
const Project = require('../models/project.model');
const ProjectVersion = require('../models/projectVersion.model');
const bus = require('../events/hub');

async function assertProject(projectId) {
  const project = await Project.findById(projectId);
  if (!project) throw { status: 404, code: 'project_not_found', message: 'Project not found' };
  return project;
}

async function listComments({ projectId, versionId = null, limit = 200, skip = 0 }) {
  await assertProject(projectId);
  const q = { projectId };
  if (versionId) q.versionId = versionId;
  return Comment.find(q).sort({ createdAt: 1 }).skip(skip).limit(limit).populate('author', 'name email');
}

async function addComment({ projectId, versionId = null, parentId = null, author, body }) {
  await assertProject(projectId);
  if (versionId) {
    const v = await ProjectVersion.findOne({ _id: versionId, projectId });
    if (!v) throw { status: 404, code: 'version_not_found', message: 'Version not found' };
  }
  if (parentId) {
    const p = await Comment.findOne({ _id: parentId, projectId });
    if (!p) throw { status: 404, code: 'parent_not_found', message: 'Parent comment not found' };
  }
  const comment = new Comment({ projectId, versionId, parentId, author, body });
  await comment.save();
  await bus.emitAsync('comment.added', { projectId, comment, author });
  return comment;
}

async function resolveComment({ projectId, commentId, resolved = true }) {
  const comment = await Comment.findOne({ _id: commentId, projectId });
  if (!comment) throw { status: 404, code: 'comment_not_found', message: 'Comment not found' };
  comment.resolved = resolved;
  await comment.save();
  return comment;
}

module.exports = { listComments, addComment, resolveComment };
