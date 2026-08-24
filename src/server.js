const dotenv = require('dotenv');
dotenv.config();

const { connect } = require('./db/mongo');
const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await connect();
    const server = app.listen(PORT, () => {
      logger.info({ port: PORT }, 'Server started');
    });

    // Real-time layer (team chat) rides on the same HTTP server.
    const { initSocketServer } = require('./realtime/socket');
    initSocketServer(server);

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down');
      server.close(async () => {
        await require('./db/mongo').disconnect();
        process.exit(0);
      });
    });

    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down');
      server.close(async () => {
        await require('./db/mongo').disconnect();
        process.exit(0);
      });
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { start };
