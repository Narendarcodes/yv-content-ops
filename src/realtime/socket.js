/**
 * Socket.IO real-time layer for yv. team chat.
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
const { verifyAccessToken, generateAccessToken, hashToken } = require('../utils/tokens');
const Membership = require('../models/membership.model');
const Channel = require('../models/channel.model');
const RefreshToken = require('../models/refreshToken.model');
const logger = require('../utils/logger');
const config = require('../config');

let io = null;

/** Initialize Socket.IO on the existing HTTP server. */
function initSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: config.corsOrigin, credentials: true },
  });

  // --- Handshake authentication ---
  // Accepts an access token (auth.token) and optionally a refresh token
  // (auth.refreshToken). If the access token is expired/invalid, the refresh
  // token is verified and a new access token is generated so the client can
  // reconnect without a full page reload / login.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      let payload = token && verifyAccessToken(String(token));

      if (!payload) {
        // Access token expired/invalid — try refresh token fallback
        const refreshToken = socket.handshake.auth?.refreshToken;
        if (refreshToken) {
          const tokenHash = hashToken(refreshToken);
          const rt = await RefreshToken.findOne({ tokenHash, revoked: { $ne: true } });
          if (rt && rt.expiresAt > new Date()) {
            payload = { sub: String(rt.userId) };
            // Generate a new access token and send it back to the client
            const newAccessToken = generateAccessToken({ sub: rt.userId });
            socket.data.userId = String(rt.userId);
            socket.data.newAccessToken = newAccessToken;
            return next();
          }
        }
        return next(new Error('unauthorized'));
      }

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
        // Channel docs store projectId; resolve its organization for the check.
        const Project = require('../models/project.model');
        const project = await Project.findById(channel.projectId).select('organizationId').lean();
        if (!project) return ack?.({ ok: false, error: 'project_not_found' });
        const member = await Membership.findOne({
          userId: socket.data.userId,
          organizationId: project.organizationId,
          disabled: { $ne: true },
        });
        if (!member) return ack?.({ ok: false, error: 'forbidden' });
        await socket.join(`channel:${channelId}`);
        ack?.({ ok: true });
      } catch (err) {
        logger.warn({ err }, 'channel:join failed');
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
