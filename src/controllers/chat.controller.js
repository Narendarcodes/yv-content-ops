const chatService = require('../services/chat.service');

async function listChannels(req, res, next) {
  try {
    const { id } = req.params;
    const channels = await chatService.listChannels({ projectId: id });
    res.json({ data: channels });
  } catch (err) {
    next(err);
  }
}

async function createChannel(req, res, next) {
  try {
    const { id } = req.params;
    const { name, type, members } = req.body;
    const channel = await chatService.createChannel({
      projectId: id,
      name,
      type,
      members: members || [],
      createdBy: req.user._id,
    });
    res.status(201).json({ data: channel });
  } catch (err) {
    next(err);
  }
}

async function listMessages(req, res, next) {
  try {
    const { id, channelId } = req.params;
    const { parentId, limit, skip } = req.query;
    const result = await chatService.listMessages({
      projectId: id,
      channelId,
      parentId: parentId || null,
      limit: parseInt(limit, 10) || 100,
      skip: parseInt(skip, 10) || 0,
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function postMessage(req, res, next) {
  try {
    const { id, channelId } = req.params;
    const { body, parentId, attachments } = req.body;
    const message = await chatService.postMessage({
      projectId: id,
      channelId,
      author: req.user._id,
      body,
      parentId: parentId || null,
      attachments: attachments || [],
    });
    res.status(201).json({ data: message });
  } catch (err) {
    next(err);
  }
}

module.exports = { listChannels, createChannel, listMessages, postMessage };
