const logger = require('../utils/logger');

function handleError(err, req, res, _next) {
  logger.error({ err, url: req.originalUrl }, 'Unhandled error');
  const status = err.status || 500;
  const code = err.code || 'internal_error';
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: { code, message } });
}

module.exports = { handleError };
