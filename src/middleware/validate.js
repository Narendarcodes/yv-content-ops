/**
 * Middleware factory: validates req.body against a Joi schema.
 * On failure responds 400 with a stable error shape.
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
    if (error) {
      const details = error.details.map((d) => ({ field: d.path.join('.'), message: d.message }));
      return res.status(400).json({ error: { code: 'validation_error', message: 'Validation failed', details } });
    }
    req[source] = value;
    next();
  };
}

module.exports = { validate };
