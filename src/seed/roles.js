const Role = require('../models/role.model');

const DEFAULT_ROLES = [
  { name: 'admin', permissions: ['*'], description: 'Full access within the organization' },
  {
    name: 'editor',
    permissions: [
      'project.create',
      'project.transition',
      'project.assign',
      'project.upload_version',
      'project.comment',
      'project.revision',
      'project.view',
      'task.create',
      'task.update',
      'brief.manage',
      'chat.post',
      'contract.manage',
      'invoice.manage',
    ],
    description: 'Creates and works on projects',
  },
  {
    name: 'reviewer',
    permissions: ['project.view', 'project.comment', 'project.revision', 'project.approve', 'task.create', 'task.update', 'chat.post'],
    description: 'Reviews drafts, comments, requests revisions, approves',
  },
  {
    name: 'publisher',
    permissions: ['project.view', 'project.schedule', 'project.publish', 'project.metrics'],
    description: 'Schedules and publishes approved projects, records metrics',
  },
];

async function seedDefaultRoles() {
  for (const r of DEFAULT_ROLES) {
    const existing = await Role.findOne({ name: r.name });
    if (existing) {
      // keep in sync: update permissions on existing roles so new capabilities apply
      if (JSON.stringify(existing.permissions || []) !== JSON.stringify(r.permissions)) {
        existing.permissions = r.permissions;
        await existing.save();
      }
    } else {
      await Role.create(r);
    }
  }
}

module.exports = { DEFAULT_ROLES, seedDefaultRoles };
