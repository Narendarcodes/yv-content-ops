const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, requireOrg, requirePermission } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { updateProfileSchema } = require('../validators/user.validator');

router.get('/me', authenticate, userController.me);
router.get('/me/organizations', authenticate, userController.myOrganizations);
router.patch('/me', authenticate, validate(updateProfileSchema), userController.updateMe);
// Profile photo upload/remove — multer is inside controller module
router.patch('/me/photo', authenticate, userController.upload.single('file'), userController.uploadPhoto);
router.delete('/me/photo', authenticate, userController.removePhoto);
router.get('/organizations/:organizationId/members', authenticate, requireOrg('organizationId'), requirePermission('manage_members'), userController.listMembers);
router.patch('/organizations/:organizationId/members/:memberUserId', authenticate, requireOrg('organizationId'), requirePermission('manage_members'), userController.updateMember);

module.exports = router;
