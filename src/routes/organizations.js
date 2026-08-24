const express = require('express');
const router = express.Router();
const controller = require('../controllers/org.controller');
const { authenticate, requireOrg, requirePermission } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createOrgSchema } = require('../validators/org.validator');

// Public availability check so the signup wizard can route users to sign-in
// BEFORE they build the rest of the form (no auth needed - slug/name only).
router.get('/availability', controller.checkAvailability);

router.post('/', authenticate, validate(createOrgSchema), controller.createOrg);
router.get('/', authenticate, controller.listOrgs);
router.post('/:organizationId/members', authenticate, requireOrg('organizationId'), requirePermission('manage_members'), controller.addMember);
router.get('/:organizationId/members', authenticate, requireOrg('organizationId'), requirePermission('project.view'), controller.listMembers);
router.patch('/:organizationId/members/:memberUserId', authenticate, requireOrg('organizationId'), requirePermission('manage_members'), controller.updateMember);

module.exports = router;
