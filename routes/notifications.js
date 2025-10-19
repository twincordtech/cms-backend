/*
 * File: notifications.js
 * Description: Express routes for advanced notification management in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const express = require('express');
const router = express.Router();
const { protect, authorizeAdmin } = require('../middleware/auth');
const {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount,
  broadcastNotification
} = require('../services/notificationService');

// Utility to sanitize string input
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.]/g, '').trim();
};

// Get user's notifications
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await getUserNotifications(req.user._id);
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
});

// Get unread count
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await getUnreadCount(req.user._id);
    res.json({
      success: true,
      data: count
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting unread count',
      error: error.message
    });
  }
});

// Create a new notification
router.post('/', protect, async (req, res) => {
  try {
    const { title, message, type, priority, data } = req.body;
    const notification = await createNotification(
      req.user._id,
      title,
      message,
      type,
      priority,
      data
    );
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error creating notification', error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await markAsRead(req.params.id, req.user._id);
    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
});

// Mark all notifications as read
router.put('/read-all', protect, async (req, res) => {
  try {
    await markAllAsRead(req.user._id);
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message
    });
  }
});

// Delete a notification
router.delete('/:id', protect, async (req, res) => {
  try {
    await deleteNotification(req.params.id, req.user._id);
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
});

// Delete all notifications
router.delete('/', protect, async (req, res) => {
  try {
    await deleteAllNotifications(req.user._id);
    res.json({
      success: true,
      message: 'All notifications deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting all notifications',
      error: error.message
    });
  }
});

// Broadcast notification to all users (admin only)
router.post('/broadcast', protect, authorizeAdmin, async (req, res) => {
  try {
    const { title, message, type, priority, data } = req.body;
    const notifications = await broadcastNotification(
      title,
      message,
      type,
      priority,
      data
    );
    res.status(201).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error broadcasting notification', error: error.message });
  }
});

module.exports = router;

// End of notifications.js
// Description: End of notifications routes file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 