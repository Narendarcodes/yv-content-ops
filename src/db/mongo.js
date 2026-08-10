const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');

let conn = null;

async function connect() {
  if (conn) return conn;
  const uri = config.mongoUri;
  logger.info({ uri: uri.replace(/:[^:@]+@/, ':****@') }, 'Connecting to MongoDB');
  conn = await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  logger.info('MongoDB connected');
  return conn;
}

async function disconnect() {
  if (!conn) return;
  await mongoose.disconnect();
  conn = null;
  logger.info('MongoDB disconnected');
}

module.exports = { connect, disconnect };
