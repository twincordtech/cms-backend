/*
 * File: notificationController.js
 * Description: Handles CRUD operations and status management for user notifications in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const Notification = require('../models/Notification');
const asyncHandler = require('express-async-handler');

// @desc    Get all notifications for the current user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch notifications for the current user with pagination
    const notifications = await Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    // Get total count for pagination
    const total = await Notification.countDocuments({ userId: req.user._id });

    // Respond with notifications and pagination info
    res.json({
        success: true,
        data: {
            notifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
});

// @desc    Mark a notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    // Find notification by ID for the current user
    const notification = await Notification.findOne({
        _id: req.params.id,
        userId: req.user._id
    });

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }

    // Mark notification as read
    notification.read = true;
    await notification.save();

    res.json(notification);
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
    // Update all unread notifications for the current user
    await Notification.updateMany(
        { userId: req.user._id, read: false },
        { read: true }
    );

    res.json({ message: 'All notifications marked as read' });
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
    // Find notification by ID for the current user
    const notification = await Notification.findOne({
        _id: req.params.id,
        userId: req.user._id
    });

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }

    // Delete the notification
    await notification.deleteOne();

    res.json({ message: 'Notification removed' });
});

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
};

// End of notificationController.js
// Description: End of notification controller file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 