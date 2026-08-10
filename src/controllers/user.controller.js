const userService = require('../services/user.service');

async function me(req, res, next) {
  try {
    const user = await userService.getMe(req.user._id);
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
}

async function listMembers(req, res, next) {
  try {
    const { organizationId } = req.params;
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

module.exports = { me, listMembers, updateMember };
