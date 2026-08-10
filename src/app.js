const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const orgRouter = require('./routes/organizations');
const projectsRouter = require('./routes/projects');
const usersRouter = require('./routes/users');
const notificationsRouter = require('./routes/notifications');
const errors = require('./middleware/errors');
const listeners = require('./events/listeners');

// wire domain events -> activity/notifications
listeners.setup();

const app = express();

app.use(helmet());
app.use(cors());
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
app.use(`${config.apiPrefix}/projects`, projectsRouter);
app.use(`${config.apiPrefix}/users`, usersRouter);
app.use(`${config.apiPrefix}/notifications`, notificationsRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: { code: 'not_found', message: 'Not found' } });
});

// error handler
app.use(errors.handleError);

module.exports = app;
