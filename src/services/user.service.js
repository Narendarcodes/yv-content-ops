const User = require('../models/user.model');
const Membership = require('../models/membership.model');

async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, code: 'user_not_found', message: 'User not found' };
  return user;
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
  return user;
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

module.exports = { getMe, listMyOrganizations, updateProfile, listOrgMembers, setMemberStatus, updateMemberRole };
