const User = require('../models/user.model');
const Membership = require('../models/membership.model');

async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) throw { status: 404, code: 'user_not_found', message: 'User not found' };
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

module.exports = { getMe, listOrgMembers, setMemberStatus, updateMemberRole };
