const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const env = process.env.NODE_ENV || 'development';

// Fail fast in production when the default/dev secret is left in place.
// Token forgery is trivial if JWT_ACCESS_SECRET is predictable.
const accessSecret = process.env.JWT_ACCESS_SECRET || 'dev_access_secret';
const DEFAULT_SECRETS = ['dev_access_secret', 'change-me'];
if (env === 'production' && DEFAULT_SECRETS.includes(accessSecret)) {
  throw new Error('JWT_ACCESS_SECRET must be set to a strong, unique value in production');
}

module.exports = {
  env,
  port: process.env.PORT || 3000,
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cop',
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  jwt: {
    accessSecret,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresDays: parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '7', 10),
  },
  storage: {
    driver: process.env.STORAGE_DRIVER || 'local',
    localDir: process.env.STORAGE_LOCAL_DIR || path.resolve(process.cwd(), 'uploads'),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
};
