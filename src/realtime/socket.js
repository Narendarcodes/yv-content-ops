/**
 * Socket.IO real-time layer for Folio team chat.
 *
 * Protocol:
 *  - Client connects with `auth: { token: <JWT> }`; the handshake is rejected
 *    unless the JWT verifies (same access tokens as REST).
 *  - After connect, the client may `channel:join` / `channel:leave` any
 *    channel of a project in its organization (membership checked).
 *  - When a message is persisted via REST, chat.service emits `message:new`
 *    to that channel's room - everyone viewing the channel receives it live.
 *
 * Rooms are named `channel:<id>` so channels are isolated per project.
 */
const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/tokens');
const Membership = require('../models/membership.model');
const Channel = require('../models/channel.model');

let io = null;

/** Initialize Socket.IO on the existing HTTP server. */
function initSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
  });

  // --- Handshake authentication ---
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const payload = token && verifyAccessToken(String(token));
      if (!payload) return next(new Error('unauthorized'));
      socket.data.userId = String(payload.sub);
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    /** Join a channel room after verifying org membership. */
    socket.on('channel:join', async ({ channelId } = {}, ack) => {
      try {
        if (!channelId) return ack?.({ ok: false, error: 'channelId required' });
        const channel = await Channel.findById(channelId).select('projectId').lean();
        if (!channel) return ack?.({ ok: false, error: 'not_found' });
        const member = await Membership.findOne({
          userId: socket.data.userId,
          organizationId: channel.projectId.organizationId ?? channel.orgId,
          disabled: { $ne: true },
        });
        // Channel docs store projectId; resolve its organization for the check.
        if (!member) {
          const Project = require('./models/project.model');
          const project = await Project.findById(channel.projectId).select('organizationId').lean();
          const orgMember = project && (await Membership.findOne({
            userId: socket.data.userId,
            organizationId: project.organizationId,
            disabled: { $ne: true },
          }));
          if (!orgMember) return ack?.({ ok: false, error: 'forbidden' });
        }
        await socket.join(`channel:${channelId}`);
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: 'join_failed' });
      }
    });

    socket.on('channel:leave', ({ channelId } = {}) => {
      if (channelId) socket.leave(`channel:${channelId}`);
    });

    socket.on('disconnect', () => {
      /* rooms auto-clean */
    });
  });

  return io;
}

/** Emit a freshly persisted message to its channel room. */
function emitMessage(projectId, channelId, message) {
  if (!io) return;
  io.to(`channel:${channelId}`).emit('message:new', {
    projectId: String(projectId),
    channelId: String(channelId),
    message: message.toObject ? message.toObject() : message,
  });
}

module.exports = { initSocketServer, emitMessage };
