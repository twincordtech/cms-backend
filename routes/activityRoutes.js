/*
 * File: activityRoutes.js
 * Description: Express routes for activity log endpoints in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const express = require('express');
const router = express.Router();
const { getActivities, getUserActivities } = require('../controllers/activityController');
const { protect } = require('../middleware/auth');

// Utility to sanitize route parameters
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-]/g, '').trim();
};

// Get all activities (protected route)
router.get('/', protect, getActivities);

// Get activities for a specific user (with input sanitization)
router.get('/user/:userId', protect, (req, res, next) => {
  req.params.userId = sanitizeString(req.params.userId);
  next();
}, getUserActivities);

module.exports = router;

// End of activityRoutes.js
// Description: End of activity routes file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 