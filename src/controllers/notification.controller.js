const notificationService = require('../services/notification.service');

async function list(req, res, next) {
  try {
    const { unreadOnly, limit, skip } = req.query;
    const notifications = await notificationService.listNotifications({
      userId: req.user._id,
      unreadOnly: unreadOnly === 'true',
      limit: parseInt(limit, 10) || 100,
      skip: parseInt(skip, 10) || 0,
    });
    // Normalize _id → id for frontend consumption
    const normalized = notifications.map((n) => {
      const obj = n.toObject ? n.toObject() : { ...n };
      const { _id, __v: _v, ...rest } = obj;
      void _v;
      return { id: String(_id), ...rest };
    });
    res.json({ data: normalized });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const { id } = req.params;
    const n = await notificationService.markRead({ userId: req.user._id, notificationId: id });
    const obj = n.toObject ? n.toObject() : { ...n };
    const { _id, __v: _v2, ...rest } = obj;
    void _v2;
    res.json({ data: { id: String(_id), ...rest } });
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    const result = await notificationService.markAllRead({ userId: req.user._id });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function unread(req, res, next) {
  try {
    const count = await notificationService.unreadCount({ userId: req.user._id });
    res.json({ data: { unread: count } });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, markRead, markAllRead, unread };
