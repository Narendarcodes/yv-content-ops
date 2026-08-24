const orgService = require('../services/org.service');

async function createOrg(req, res, next) {
  try {
    const { name, slug } = req.body;
    const adminUserId = req.user._id;
    const result = await orgService.createOrganization({ name, slug, adminUserId });
    res.status(201).json({ data: result.org });
  } catch (err) {
    next(err);
  }
}

async function addMember(req, res, next) {
  try {
    const { organizationId } = req.params;
    const { email, role } = req.body;
    const membership = await orgService.addMember({ organizationId, userEmail: email, roleName: role });
    res.status(201).json({ data: membership });
  } catch (err) {
    next(err);
  }
}

async function listMembers(req, res, next) {
  try {
    const { organizationId } = req.params;
    const userService = require('../services/user.service');
    const members = await userService.listOrgMembers({ organizationId });
    res.json({ data: members });
  } catch (err) {
    next(err);
  }
}

async function updateMember(req, res, next) {
  try {
    const { organizationId, memberUserId } = req.params;
    const { disabled, role } = req.body;
    const userService = require('../services/user.service');
    let result;
    if (role !== undefined) {
      result = await userService.updateMemberRole({ organizationId, userId: memberUserId, roleName: role });
    } else {
      result = await userService.setMemberStatus({ organizationId, userId: memberUserId, disabled: !!disabled });
    }
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function listOrgs(req, res, next) {
  try {
    const orgs = await orgService.listUserOrganizations(req.user._id);
    res.json({ data: orgs });
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrg, addMember, listMembers, updateMember, listOrgs };
