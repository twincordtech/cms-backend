/*
 * File: notificationService.js
 * Description: Handles notification creation, user notification management, and admin alerts for the CMS application.
 * Design & Developed by: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private Limited
 */

const Notification = require('../models/Notification');
const User = require('../models/User');

// Types of notifications for categorization
const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  NEWSLETTER: 'newsletter'
};

// Notification priority levels
const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

/**
 * Create a new notification for a user.
 * @param {String} userId - The user's MongoDB ID
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {String} type - Notification type/category
 * @param {String} priority - Notification priority
 * @param {Object} data - Additional data for the notification
 * @returns {Promise<Object>} - The created notification
 */
const createNotification = async (userId, title, message, type = 'info', priority = 'medium', data = {}) => {
  try {
    const notification = new Notification({
      userId,
      title,
      message,
      type,
      priority,
      data,
      read: false
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create a newsletter notification for all admin users.
 * @param {Array} adminUsers - List of admin user documents
 * @param {Object} newsletter - The newsletter document
 * @param {String} notificationType - 'upcoming' or 'sent'
 */
const createNewsletterNotification = async (adminUsers, newsletter, notificationType = 'upcoming') => {
  try {
    const title = notificationType === 'upcoming' 
      ? 'Upcoming Newsletter Schedule'
      : 'Newsletter Sent Successfully';
    const message = notificationType === 'upcoming'
      ? `Newsletter "${newsletter.subject}" is scheduled to be sent in 10 minutes`
      : `Newsletter "${newsletter.subject}" has been sent successfully`;
    const notificationPromises = adminUsers.map(admin => 
      createNotification(
        admin._id,
        title,
        message,
        'info',
        'high',
        {
          newsletterId: newsletter._id,
          subject: newsletter.subject,
          scheduleTime: newsletter.schedule.scheduleTime,
          nextSendDate: newsletter.schedule.nextSendDate,
          type: notificationType
        }
      )
    );
    await Promise.all(notificationPromises);
  } catch (error) {
    console.error('Error creating newsletter notifications:', error);
    throw error;
  }
};

/**
 * Get notifications for a user, paginated.
 * @param {String} userId - The user's MongoDB ID
 * @param {Number} page - Page number
 * @param {Number} limit - Results per page
 * @returns {Promise<Array>} - List of notifications
 */
const getUserNotifications = async (userId, page = 1, limit = 50) => {
  try {
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Mark a notification as read for a user.
 * @param {String} notificationId - The notification's MongoDB ID
 * @param {String} userId - The user's MongoDB ID
 * @returns {Promise<Object>} - The updated notification
 */
const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    );
    if (!notification) {
      throw new Error('Notification not found');
    }
    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user.
 * @param {String} userId - The user's MongoDB ID
 * @returns {Promise<Boolean>} - True if successful
 */
const markAllAsRead = async (userId) => {
  try {
    await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete a notification for a user.
 * @param {String} notificationId - The notification's MongoDB ID
 * @param {String} userId - The user's MongoDB ID
 * @returns {Promise<Object>} - The deleted notification
 */
const deleteNotification = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });
    if (!notification) {
      throw new Error('Notification not found');
    }
    return notification;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Delete all notifications for a user.
 * @param {String} userId - The user's MongoDB ID
 */
const deleteAllNotifications = async (userId) => {
  try {
    await Notification.deleteMany({ userId });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
};

/**
 * Get the count of unread notifications for a user.
 * @param {String} userId - The user's MongoDB ID
 * @returns {Promise<Number>} - Count of unread notifications
 */
const getUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({ userId, read: false });
    return count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};

/**
 * Broadcast a notification to all users (admin only).
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {String} type - Notification type/category
 * @param {String} priority - Notification priority
 * @param {Object} data - Additional data for the notification
 * @returns {Promise<Array>} - List of created notifications
 */
const broadcastNotification = async (title, message, type = 'info', priority = 'medium', data = {}) => {
  try {
    const users = await User.find({}, '_id');
    const notifications = [];
    for (const user of users) {
      const notification = await createNotification(
        user._id,
        title,
        message,
        type,
        priority,
        data
      );
      notifications.push(notification);
    }
    return notifications;
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    throw error;
  }
};

module.exports = {
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
  createNotification,
  createNewsletterNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount,
  broadcastNotification
};

/*
 * End of notificationService.js
 * Description: End of notification service file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private Limited
 */
