const bus = require('./hub');
const activity = require('../services/activity.service');
const notifications = require('../services/notification.service');
const Project = require('../models/project.model');

function describeProject(project) {
  return { title: project.title, status: project.status };
}

async function projectContext(projectId) {
  try {
    const p = await Project.findById(projectId);
    return p ? describeProject(p) : {};
  } catch (e) {
    return {};
  }
}

async function setup() {
  bus.on('project.created', async ({ projectId, actorId }) => {
    await activity.recordActivity({ projectId, actor: actorId, action: 'created', entityType: 'Project', entityId: projectId });
  });

  bus.on('project.transitioned', async ({ projectId, from, to, actorId }) => {
    await activity.recordActivity({
      projectId,
      actor: actorId,
      action: 'transitioned',
      entityType: 'Project',
      entityId: projectId,
      metadata: { from, to },
    });
  });

  bus.on('project.assigned', async ({ projectId, assigneeId, actorId }) => {
    await activity.recordActivity({
      projectId,
      actor: actorId,
      action: 'assigned',
      entityType: 'User',
      entityId: assigneeId,
    });
    const p = await projectContext(projectId);
    if (assigneeId && assigneeId.toString() !== (actorId || '').toString()) {
      await notifications.createNotification({
        userId: assigneeId,
        type: 'project_assigned',
        projectId,
        title: 'Project assigned to you',
        body: `You have been assigned: ${p.title || ''}`,
      });
    }
  });

  bus.on('version.uploaded', async ({ projectId, version, uploaderId }) => {
    await activity.recordActivity({
      projectId,
      actor: uploaderId,
      action: 'version_uploaded',
      entityType: 'ProjectVersion',
      entityId: version._id,
      metadata: { versionNumber: version.versionNumber },
    });
    const p = await Project.findById(projectId);
    if (p) {
      await notifications.notifyOrgMembersWithPermission({
        organizationId: p.organizationId,
        permission: 'project.approve',
        type: 'draft_uploaded',
        projectId,
        title: 'New draft uploaded',
        body: `Version ${version.versionNumber} of "${p.title}" is ready for review.`,
        payload: { versionId: version._id, versionNumber: version.versionNumber },
      });
    }
  });

  bus.on('comment.added', async ({ projectId, comment, author }) => {
    await activity.recordActivity({
      projectId,
      actor: author,
      action: 'comment_added',
      entityType: 'Comment',
      entityId: comment._id,
    });
    const p = await Project.findById(projectId);
    if (p && p.assignee && p.assignee.toString() !== author.toString()) {
      await notifications.createNotification({
        userId: p.assignee,
        type: 'comment_added',
        projectId,
        title: 'New comment',
        body: `Someone commented on "${p.title}".`,
        payload: { commentId: comment._id },
      });
    }
  });

  bus.on('revision.requested', async ({ projectId, revision, requester }) => {
    await activity.recordActivity({
      projectId,
      actor: requester,
      action: 'revision_requested',
      entityType: 'RevisionRequest',
      entityId: revision._id,
      metadata: { revisionNumber: revision.revisionNumber },
    });
    const p = await Project.findById(projectId);
    if (p) {
      const target = p.assignee || p.creator;
      if (target && target.toString() !== (requester || '').toString()) {
        await notifications.createNotification({
          userId: target,
          type: 'revision_requested',
          projectId,
          title: 'Revision requested',
          body: `Revision ${revision.revisionNumber} requested on "${p.title}".`,
        });
      }
    }
  });

  bus.on('revision.updated', async ({ projectId, revision, status, submitter }) => {
    await activity.recordActivity({
      projectId,
      actor: submitter,
      action: 'revision_updated',
      entityType: 'RevisionRequest',
      entityId: revision._id,
      metadata: { status, revisionNumber: revision.revisionNumber },
    });
    if (status === 'submitted') {
      const p = await Project.findById(projectId);
      if (p) {
        await notifications.notifyOrgMembersWithPermission({
          organizationId: p.organizationId,
          permission: 'project.approve',
          type: 'revision_submitted',
          projectId,
          title: 'Revision submitted',
          body: `Revision ${revision.revisionNumber} of "${p.title}" is ready for review.`,
        });
      }
    }
  });

  bus.on('project.approved', async ({ projectId, versionId, approverId }) => {
    await activity.recordActivity({
      projectId,
      actor: approverId,
      action: 'approved',
      entityType: 'ProjectVersion',
      entityId: versionId,
    });
    const p = await Project.findById(projectId);
    if (p) {
      await notifications.notifyOrgMembersWithPermission({
        organizationId: p.organizationId,
        permission: 'project.schedule',
        type: 'approved',
        projectId,
        title: 'Project approved',
        body: `"${p.title}" has been approved and is ready to schedule.`,
        payload: { versionId },
      });
    }
  });

  bus.on('project.scheduled', async ({ projectId, scheduledAt, actorId }) => {
    await activity.recordActivity({
      projectId,
      actor: actorId,
      action: 'scheduled',
      entityType: 'Project',
      entityId: projectId,
      metadata: { scheduledAt },
    });
  });

  bus.on('project.published', async ({ projectId, publication, publishedBy }) => {
    await activity.recordActivity({
      projectId,
      actor: publishedBy,
      action: 'published',
      entityType: 'Publication',
      entityId: publication._id,
      metadata: { platform: publication.platform, postUrl: publication.postUrl },
    });
  });

  bus.on('metric.recorded', async ({ projectId, metric, recordedBy }) => {
    await activity.recordActivity({
      projectId,
      actor: recordedBy,
      action: 'metric_recorded',
      entityType: 'PerformanceMetric',
      entityId: metric._id,
      metadata: { metric: metric.metric, value: metric.value },
    });
  });

  bus.on('input.requested', async ({ projectId, input }) => {
    await activity.recordActivity({
      projectId,
      actor: input.requestedBy,
      action: 'input_requested',
      entityType: 'Input',
      entityId: input._id,
      metadata: { title: input.title },
    });
  });

  bus.on('input.updated', async ({ projectId, input, actorId, state }) => {
    await activity.recordActivity({
      projectId,
      actor: actorId,
      action: 'input_updated',
      entityType: 'Input',
      entityId: input._id,
      metadata: { title: input.title, state },
    });
  });
}

module.exports = { setup };
