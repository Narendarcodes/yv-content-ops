const logger = require('../utils/logger');
const config = require('../config');

function handleError(err, req, res, _next) {
  logger.error({ err, url: req.originalUrl }, 'Unhandled error');

  // Mongoose: invalid ObjectId in a query/param -> 400, not a 500
  if (err.name === 'CastError') {
    return res
      .status(400)
      .json({ error: { code: 'invalid_id', message: 'Invalid identifier format' } });
  }

  // Mongoose: model-level validation (e.g. missing required field) -> 400
  if (err.name === 'ValidationError') {
    const details = Object.entries(err.errors).map(([field, e]) => ({
      field,
      message: e.message,
    }));
    return res
      .status(400)
      .json({ error: { code: 'validation_error', message: 'Validation failed', details } });
  }

  // MongoDB duplicate key (unique index) -> 409
  if (err.code === 11000) {
    return res
      .status(409)
      .json({ error: { code: 'conflict', message: 'Duplicate value for a unique field' } });
  }

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
