/*
 * File: notificationRoutes.js
 * Description: Express routes for notification management in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require('../controllers/notificationController');

// Utility to sanitize string input
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.]/g, '').trim();
};

// All routes are protected
router.use(protect);

// Get all notifications for the current user
router.get('/', getNotifications);

// Mark a notification as read
router.patch('/:id/read', markAsRead);

// Mark all notifications as read
router.patch('/read-all', markAllAsRead);

// Delete a notification
router.delete('/:id', deleteNotification);

module.exports = router;

// End of notificationRoutes.js
// Description: End of notification routes file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 