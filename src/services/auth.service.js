const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const RefreshToken = require('../models/refreshToken.model');
const { generateAccessToken, generateRefreshToken, hashToken } = require('../utils/tokens');

const REFRESH_EXPIRES_DAYS = parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '7', 10);

async function register({ name, email, password }) {
  const existing = await User.findOne({ email });
  if (existing) throw { status: 409, code: 'user_exists', message: 'User already exists' };
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const user = new User({ name, email, passwordHash });
  await user.save();
  return user;
}

async function authenticate({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) throw { status: 401, code: 'invalid_credentials', message: 'Invalid credentials' };
  if (user.disabled) throw { status: 403, code: 'user_disabled', message: 'User disabled' };
  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) throw { status: 401, code: 'invalid_credentials', message: 'Invalid credentials' };
  const accessToken = generateAccessToken({ sub: user._id, email: user.email });
  const rawRefresh = generateRefreshToken();
  const tokenHash = hashToken(rawRefresh);
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  const rt = new RefreshToken({ userId: user._id, tokenHash, expiresAt });
  await rt.save();
  return { user, accessToken, refreshToken: rawRefresh };
}

async function revokeRefreshToken(token) {
  const tokenHash = hashToken(token);
  const rt = await RefreshToken.findOne({ tokenHash });
  if (!rt) return false;
  rt.revoked = true;
  await rt.save();
  return true;
}

async function rotateRefreshToken(oldToken) {
  const oldHash = hashToken(oldToken);
  const rt = await RefreshToken.findOne({ tokenHash: oldHash });
  if (!rt) throw { status: 401, code: 'invalid_refresh', message: 'Invalid refresh token' };
  if (rt.expiresAt < new Date()) throw { status: 401, code: 'expired_refresh', message: 'Refresh token expired' };
  if (rt.revoked) {
    // Allow grace for concurrent refreshes that race on the same old token:
    // if this token was already rotated, check if the replacement is still valid
    // and treat this as a replay within the window — issue a new rotation instead of hard failing.
    if (rt.replacedByToken) {
      const replacement = await RefreshToken.findOne({ tokenHash: rt.replacedByToken });
      if (replacement && !replacement.revoked && replacement.expiresAt > new Date()) {
        // Issue a fresh token for the racing request (extend the chain)
        const newRaw = generateRefreshToken();
        const newHash = hashToken(newRaw);
        const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
        // reuse the valid replacement as the parent for auditing
        const nrt = new RefreshToken({ userId: replacement.userId, tokenHash: newHash, expiresAt });
        await nrt.save();
        return { newRefresh: newRaw, userId: replacement.userId };
      }
    }
    throw { status: 401, code: 'invalid_refresh', message: 'Invalid refresh token' };
  }
  // create new
  const newRaw = generateRefreshToken();
  const newHash = hashToken(newRaw);
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  rt.revoked = true;
  rt.replacedByToken = newHash;
  await rt.save();
  const nrt = new RefreshToken({ userId: rt.userId, tokenHash: newHash, expiresAt });
  await nrt.save();
  return { newRefresh: newRaw, userId: rt.userId };
}

module.exports = { register, authenticate, revokeRefreshToken, rotateRefreshToken };
