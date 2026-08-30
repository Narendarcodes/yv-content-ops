const userService = require('../services/user.service');
const multer = require('multer');

// In-memory multer for profile photo uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB cap
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

async function me(req, res, next) {
  try {
    const user = await userService.getMe(req.user._id);
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
}

async function myOrganizations(req, res, next) {
  try {
    const orgs = await userService.listMyOrganizations(req.user._id);
    res.json({ data: orgs });
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const user = await userService.updateProfile(req.user._id, req.body);
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
}

async function uploadPhoto(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: { code: 'no_file', message: 'No image provided' } });
    const user = await userService.setProfilePhoto(req.user._id, req.file.buffer, req.file.originalname, req.file.mimetype);
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
}

async function removePhoto(req, res, next) {
  try {
    const user = await userService.removeProfilePhoto(req.user._id);
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

module.exports = { me, myOrganizations, updateMe, uploadPhoto, removePhoto, listMembers, updateMember, upload };
