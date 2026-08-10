const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');

function generateAccessToken(payload) {
  return jwt.sign(payload, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpiresIn });
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, config.jwt.accessSecret);
  } catch (e) {
    return null;
  }
}

module.exports = { generateAccessToken, generateRefreshToken, hashToken, verifyAccessToken };
