const { verifyAccessToken } = require('../utils/tokens');
const User = require('../models/user.model');
const Membership = require('../models/membership.model');

async function authenticate(req, res, next) {
  try {
    const auth = req.headers.authorization;
    let token = null;
    if (auth && auth.startsWith('Bearer ')) {
      token = auth.slice('Bearer '.length);
    } else if (req.cookies && req.cookies.accessToken) {
      // Cookie-based fallback (cookie-parser is installed in app.js)
      token = req.cookies.accessToken;
    } else if (req.query && req.query.token) {
      // Query-param fallback for transports that cannot send headers or
      // cookies — <video>/<audio> src attributes. Only the media stream
      // route exposes URLs with this, and invalid tokens are still rejected
      // below, so this is not an auth bypass.
      token = String(req.query.token);
    }
    if (!token) return res.status(401).json({ error: { code: 'unauthenticated', message: 'Missing token' } });
    const payload = verifyAccessToken(token);
    if (!payload) return res.status(401).json({ error: { code: 'invalid_token', message: 'Invalid token' } });
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: { code: 'user_not_found', message: 'User not found' } });
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

function requireOrg(orgParam = 'organizationId') {
  return async function (req, res, next) {
    const orgId = req.params[orgParam] || req.body[orgParam] || req.query[orgParam];
    if (!orgId) return res.status(400).json({ error: { code: 'missing_organization', message: 'Organization id required' } });
    const membership = await Membership.findOne({ userId: req.user._id, organizationId: orgId });
    if (!membership || membership.disabled) return res.status(403).json({ error: { code: 'forbidden', message: 'Not a member of organization' } });
    req.membership = membership;
    next();
  };
}

function requirePermission(permission) {
  return async function (req, res, next) {
    const Role = require('../models/role.model');
    try {
      let orgId = req.params.organizationId || req.body.organizationId || req.query.organizationId;
      if (!orgId && req.params.id) {
        const Project = require('../models/project.model');
        const p = await Project.findById(req.params.id);
        if (p) orgId = p.organizationId;
      }
      // expose resolved org to controllers that need it
      if (orgId) req.projectOrgId = orgId;

      let membership = req.membership;
      if (!membership) membership = await Membership.findOne({ userId: req.user._id, organizationId: orgId });
      if (!membership || membership.disabled) return res.status(403).json({ error: { code: 'forbidden', message: 'Not a member of organization' } });

      let role;
      if (membership.role && typeof membership.role === 'string' && membership.role.match(/^[0-9a-fA-F]{24}$/)) {
        role = await Role.findById(membership.role);
      } else {
        role = await Role.findOne({ name: membership.role });
      }
      if (!role) return res.status(403).json({ error: { code: 'forbidden', message: 'Role not found' } });
      const perms = role.permissions || [];
      if (perms.includes('*') || perms.includes(permission)) return next();
      return res.status(403).json({ error: { code: 'forbidden', message: 'Insufficient permission' } });
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Require the signed-in user to hold an active membership in the
 * organization that owns the project at req.params.id.
 * Used by routes addressed by projectId alone (no organizationId in the path).
 */
function requireProjectMember(idParam = 'id') {
  return async function (req, res, next) {
    try {
      const Project = require('../models/project.model');
      const project = await Project.findById(req.params[idParam]).select('organizationId').lean();
      if (!project) return res.status(404).json({ error: { code: 'project_not_found', message: 'Project not found' } });
      const membership = await Membership.findOne({
        userId: req.user._id,
        organizationId: project.organizationId,
        disabled: { $ne: true },
      });
      if (!membership) return res.status(403).json({ error: { code: 'forbidden', message: 'Not a member of this project’s organization' } });
      req.membership = membership;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { authenticate, requireOrg, requirePermission, requireProjectMember };
