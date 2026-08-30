const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const config = require('./config');
const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const orgRouter = require('./routes/organizations');
const contractsRouter = require('./routes/contracts');
const invoicesRouter = require('./routes/invoices');
const projectsRouter = require('./routes/projects');
const usersRouter = require('./routes/users');
const notificationsRouter = require('./routes/notifications');
const docsRouter = require('./routes/docs');
const errors = require('./middleware/errors');
const listeners = require('./events/listeners');

// wire domain events -> activity/notifications
listeners.setup();

const app = express();

app.use(helmet());
// CORS: restrict to configured origins in production (CORS_ORIGIN=comma-separated);
// defaults to reflecting any origin for development convenience.
// credentials:true is required because the frontend sends requests with
// credentials:'include' (cookie-based session fallback) — without it the browser
// blocks the response (Access-Control-Allow-Credentials must be 'true').
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// global rate limiting (per IP)
app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'rate_limited', message: 'Too many requests, please try again later' } },
  })
);

if (config.env !== 'test') {
  app.use(morgan('dev'));
}

app.use(`${config.apiPrefix}/health`, healthRouter);
app.use(`${config.apiPrefix}/auth`, authRouter);
app.use(`${config.apiPrefix}/organizations`, orgRouter);
app.use(`${config.apiPrefix}/organizations/:organizationId/concepts`, require('./routes/concepts'));
app.use(`${config.apiPrefix}/organizations`, contractsRouter);
app.use(`${config.apiPrefix}/organizations`, invoicesRouter);
app.use(`${config.apiPrefix}/projects`, projectsRouter);
app.use(`${config.apiPrefix}/users`, usersRouter);
app.use(`${config.apiPrefix}/notifications`, notificationsRouter);
// API docs (OpenAPI spec + Swagger UI)
app.use(`${config.apiPrefix}/docs`, docsRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: { code: 'not_found', message: 'Not found' } });
});

// error handler
app.use(errors.handleError);

module.exports = app;
