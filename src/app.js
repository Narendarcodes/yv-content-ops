const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');
const healthRouter = require('./routes/health');
const errors = require('./middleware/errors');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use(`${config.apiPrefix}/health`, healthRouter);

// 404
app.use((req, res, next) => {
  res.status(404).json({ error: { code: 'not_found', message: 'Not found' } });
});

// error handler
app.use(errors.handleError);

module.exports = app;
