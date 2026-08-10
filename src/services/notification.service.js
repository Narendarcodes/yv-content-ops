const Notification = require('../models/notification.model');
const Membership = require('../models/membership.model');

async function createNotification({ userId, type, projectId = null, title = '', body = '', payload = {} }) {
  const n = new Notification({ userId, type, projectId, title, body, payload });
  await n.save();
  return n;
}

/**
 * Notify every member of an organization whose role grants the given permission.
 * Used for broadcast-ish workflow notifications (e.g. notify reviewers on draft upload).
 */
async function notifyOrgMembersWithPermission({ organizationId, permission, type, projectId, title, body, payload = {} }) {
  const Role = require('../models/role.model');
  const memberships = await Membership.find({ organizationId, disabled: { $ne: true } });
  // collect role names that grant the permission
  const roles = await Role.find({ name: { $in: memberships.map((m) => m.role) } });
  const allowedNames = new Set();
  for (const role of roles) {
    const perms = role.permissions || [];
    if (perms.includes('*') || perms.includes(permission)) allowedNames.add(role.name);
  }
  const targets = new Set();
  for (const m of memberships) {
    if (allowedNames.has(m.role)) targets.add(m.userId.toString());
  }
  // Insert notifications in parallel instead of N sequential round-trips.
  const results = await Promise.all(
    [...targets].map((userId) => createNotification({ userId, type, projectId, title, body, payload }))
  );
  return results;
}

async function listNotifications({ userId, unreadOnly = false, limit = 100, skip = 0 }) {
  const q = { userId };
  if (unreadOnly) q.read = false;
  return Notification.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit);
}

async function markRead({ userId, notificationId }) {
  const n = await Notification.findOne({ _id: notificationId, userId });
  if (!n) throw { status: 404, code: 'notification_not_found', message: 'Notification not found' };
  n.read = true;
  n.readAt = new Date();
  await n.save();
  return n;
}

async function markAllRead({ userId }) {
  await Notification.updateMany({ userId, read: false }, { read: true, readAt: new Date() });
  return { updated: true };
}

async function unreadCount({ userId }) {
  return Notification.countDocuments({ userId, read: false });
}

module.exports = {
  createNotification,
  notifyOrgMembersWithPermission,
  listNotifications,
  markRead,
  markAllRead,
  unreadCount,
};
