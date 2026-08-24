const authService = require('../services/auth.service');

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const user = await authService.register({ name, email, password });
    res.status(201).json({ data: user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.authenticate({ email, password });
    // Include the primary org role so the client can render role-based UX
    // straight from the login response.
    const Membership = require('../models/membership.model');
    const membership = await Membership.findOne({ userId: user._id, disabled: { $ne: true } }).sort({ createdAt: 1 });
    const u = user.toObject();
    u.role = membership ? membership.role : 'member';
    res.json({ data: { user: u, accessToken, refreshToken } });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const { newRefresh, userId } = await authService.rotateRefreshToken(refreshToken);
    const accessToken = require('../utils/tokens').generateAccessToken({ sub: userId });
    res.json({ data: { accessToken, refreshToken: newRefresh } });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    await authService.revokeRefreshToken(refreshToken);
    res.json({ data: { loggedOut: true } });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const userService = require('../services/user.service');
    const user = await userService.getMe(req.user._id);
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout, me };
