const User = require('../models/user.model');
const Membership = require('../models/membership.model');
const uploadService = require('./upload.service');

async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, code: 'user_not_found', message: 'User not found' };
  // Attach the user's primary organization role so role-based UX in the
  // frontend reflects what the backend actually enforces (membership.role).
  const membership = await Membership.findOne({ userId, disabled: { $ne: true } }).sort({ createdAt: 1 });
  const plain = user.toObject();
  // Normalize avatar fields — expose both aliases for frontend compat
  const avatarUrl = plain.photoUrl || plain.profileImage || null;
  plain.photoUrl = avatarUrl;
  plain.profileImage = avatarUrl;
  plain.role = membership ? membership.role : 'member';
  return plain;
}

async function listMyOrganizations(userId) {
  // Disabled memberships are treated as not-a-member by requireOrg, so exclude
  // them here too — a disabled user must not see the org in a switcher.
  const memberships = await Membership.find({ userId, disabled: { $ne: true } })
    .populate('organizationId', 'name slug settings')
    .sort({ createdAt: 1 });
  return memberships.map((m) => ({
    membershipId: m._id,
    organization: m.organizationId,
    role: m.role,
  }));
}

async function updateProfile(userId, { name, email }) {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, code: 'user_not_found', message: 'User not found' };
  if (name !== undefined) user.name = name;
  if (email !== undefined) {
    const normalized = email.trim().toLowerCase();
    if (normalized !== user.email) {
      const existing = await User.findOne({ email: normalized });
      if (existing && existing._id.toString() !== userId.toString()) {
        throw { status: 409, code: 'email_in_use', message: 'Email already registered' };
      }
      user.email = normalized;
    }
  }
  await user.save();
  const plain = user.toObject();
  const avatarUrl = plain.photoUrl || plain.profileImage || null;
  plain.photoUrl = avatarUrl;
  plain.profileImage = avatarUrl;
  return plain;
}

async function listOrgMembers({ organizationId }) {
  return Membership.find({ organizationId })
    .populate('userId', 'name email disabled')
    .sort({ createdAt: 1 });
}

async function setMemberStatus({ organizationId, userId, disabled }) {
  const m = await Membership.findOne({ organizationId, userId });
  if (!m) throw { status: 404, code: 'membership_not_found', message: 'Membership not found' };
  m.disabled = disabled;
  await m.save();
  return m;
}

async function updateMemberRole({ organizationId, userId, roleName }) {
  const Role = require('../models/role.model');
  const role = await Role.findOne({ name: roleName });
  if (!role) throw { status: 400, code: 'invalid_role', message: 'Role does not exist' };
  const m = await Membership.findOne({ organizationId, userId });
  if (!m) throw { status: 404, code: 'membership_not_found', message: 'Membership not found' };
  m.role = roleName;
  await m.save();
  return m;
}

/**
 * Set a user's profile photo by uploading a file buffer.
 * Returns the updated user object.
 */
async function setProfilePhoto(userId, buffer, filename, mimeType) {
  await uploadService.uploadProfilePhoto(userId, buffer, filename, mimeType);
  return getMe(userId);
}

/**
 * Remove a user's profile photo.
 * Returns the updated user object.
 */
async function removeProfilePhoto(userId) {
  await uploadService.removeProfilePhoto(userId);
  return getMe(userId);
}

module.exports = { getMe, listMyOrganizations, updateProfile, listOrgMembers, setMemberStatus, updateMemberRole, setProfilePhoto, removeProfilePhoto };
