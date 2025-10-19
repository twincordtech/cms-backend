/*
 * File: authRoutes.js
 * Description: Express routes for authentication and token management in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const express = require('express');
const router = express.Router();
const { register, login, logout, refreshToken } = require('../controllers/authController');
const { validateRefreshToken } = require('../middleware/auth');

// Utility to sanitize string input
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.]/g, '').trim();
};

// ... existing routes ...

// Refresh token route (with input sanitization)
router.post('/refresh-token', (req, res, next) => {
  if (req.body && req.body.refreshToken) {
    req.body.refreshToken = sanitizeString(req.body.refreshToken);
  }
  next();
}, validateRefreshToken, refreshToken);

module.exports = router;

// End of authRoutes.js
// Description: End of authentication routes file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 