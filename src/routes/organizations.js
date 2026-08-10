const express = require('express');
const router = express.Router();
const controller = require('../controllers/org.controller');
const { authenticate, requireOrg, requirePermission } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createOrgSchema } = require('../validators/org.validator');

router.post('/', authenticate, validate(createOrgSchema), controller.createOrg);
router.post('/:organizationId/members', authenticate, requireOrg('organizationId'), requirePermission('manage_members'), controller.addMember);
router.get('/:organizationId/members', authenticate, requireOrg('organizationId'), requirePermission('manage_members'), controller.listMembers);
router.patch('/:organizationId/members/:memberUserId', authenticate, requireOrg('organizationId'), requirePermission('manage_members'), controller.updateMember);

module.exports = router;
