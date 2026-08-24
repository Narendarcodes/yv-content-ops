const Organization = require('../models/organization.model');
const Membership = require('../models/membership.model');
const Role = require('../models/role.model');
const User = require('../models/user.model');
const { seedDefaultRoles } = require('../seed/roles');

async function createOrganization({ name, slug, adminUserId }) {
  const org = new Organization({ name, slug });
  await org.save();
  // ensure default roles exist (admin, editor, reviewer, publisher)
  await seedDefaultRoles();
  // create membership for admin
  const membership = new Membership({ userId: adminUserId, organizationId: org._id, role: 'admin' });
  await membership.save();
  return { org, membership };
}

async function addMember({ organizationId, userEmail, roleName }) {
  const user = await User.findOne({ email: userEmail });
  if (!user) throw { status: 404, code: 'user_not_found', message: 'User not found' };
  const existing = await Membership.findOne({ userId: user._id, organizationId });
  if (existing) throw { status: 409, code: 'membership_exists', message: 'User already member' };
  const role = await Role.findOne({ name: roleName });
  if (!role) throw { status: 400, code: 'invalid_role', message: 'Role does not exist' };
  const membership = new Membership({ userId: user._id, organizationId, role: roleName });
  await membership.save();
  return membership;
}

async function listUserOrganizations(userId) {
  const memberships = await Membership.find({ userId }).populate('organizationId');
  return memberships.map((m) => m.organizationId).filter(Boolean);
}

module.exports = { createOrganization, addMember, listUserOrganizations };
