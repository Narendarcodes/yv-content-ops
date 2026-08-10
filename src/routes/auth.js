const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} = require('../validators/auth.validator');
const { authenticate } = require('../middleware/auth');

router.post('/register', validate(registerSchema), controller.register);
router.post('/login', validate(loginSchema), controller.login);
router.post('/refresh', validate(refreshSchema), controller.refresh);
router.post('/logout', validate(logoutSchema), controller.logout);
router.get('/me', authenticate, controller.me);

module.exports = router;
