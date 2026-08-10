const Channel = require('../models/channel.model');
const ChatMessage = require('../models/chatMessage.model');
const Project = require('../models/project.model');
const bus = require('../events/hub');

async function assertProject(projectId) {
  const project = await Project.findById(projectId);
  if (!project) throw { status: 404, code: 'project_not_found', message: 'Project not found' };
  return project;
}

async function assertChannel(projectId, channelId) {
  const channel = await Channel.findOne({ _id: channelId, projectId });
  if (!channel) throw { status: 404, code: 'channel_not_found', message: 'Channel not found' };
  return channel;
}

async function listChannels({ projectId }) {
  await assertProject(projectId);
  return Channel.find({ projectId }).sort({ createdAt: 1 });
}

async function createChannel({ projectId, name, type = 'channel', members = [], createdBy }) {
  await assertProject(projectId);
  const channel = new Channel({ projectId, name, type, members, createdBy });
  await channel.save();
  await bus.emitAsync('channel.created', { projectId, channel, actorId: createdBy });
  return channel;
}

async function listMessages({ projectId, channelId, parentId = null, limit = 100, skip = 0 }) {
  await assertProject(projectId);
  await assertChannel(projectId, channelId);
  const q = { channelId, parentId: parentId || null };
  const [items, total] = await Promise.all([
    ChatMessage.find(q)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name email'),
    ChatMessage.countDocuments(q),
  ]);
  return { items, total, limit, skip };
}

async function postMessage({ projectId, channelId, author, body, parentId = null, attachments = [] }) {
  await assertProject(projectId);
  await assertChannel(projectId, channelId);
  if (parentId) {
    const parent = await ChatMessage.findOne({ _id: parentId, channelId });
    if (!parent) throw { status: 404, code: 'parent_not_found', message: 'Parent message not found' };
  }
  const message = new ChatMessage({ channelId, projectId, author, body, parentId, attachments });
  await message.save();
  await bus.emitAsync('chat.message_sent', { projectId, channelId, message, author });
  return message;
}

module.exports = { listChannels, createChannel, listMessages, postMessage };
