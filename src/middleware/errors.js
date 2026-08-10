const logger = require('../utils/logger');
const config = require('../config');

function handleError(err, req, res, _next) {
  logger.error({ err, url: req.originalUrl }, 'Unhandled error');
  const status = err.status || 500;
  const code = err.code || 'internal_error';

  // Never leak internal error details (stack traces, DB internals) to clients
  // in production. Known domain errors (with an explicit status) may surface
  // their message; everything else gets a generic response.
  const safe =
    config.env === 'production' && status >= 500 && !err.expose
      ? 'Internal server error'
      : err.message || 'Internal server error';
  res.status(status).json({ error: { code, message: safe } });
}

module.exports = { handleError };
