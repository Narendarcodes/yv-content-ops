const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, requireOrg, requirePermission } = require('../middleware/auth');

router.get('/me', authenticate, userController.me);
router.get('/organizations/:organizationId/members', authenticate, requireOrg('organizationId'), requirePermission('manage_members'), userController.listMembers);
router.patch('/organizations/:organizationId/members/:memberUserId', authenticate, requireOrg('organizationId'), requirePermission('manage_members'), userController.updateMember);

module.exports = router;
