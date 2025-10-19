/*
 * File: Notification.js
 * Description: Mongoose schema for user notifications and alerts in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const mongoose = require('mongoose');

// Valid notification types
const VALID_NOTIFICATION_TYPES = ['info', 'success', 'warning', 'error', 'newsletter'];
// Valid priority levels
const VALID_PRIORITIES = ['low', 'medium', 'high'];

// Sanitize string input to prevent injection attacks
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.,]/g, '').trim();
};

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    set: sanitizeString
  },
  message: {
    type: String,
    required: true,
    set: sanitizeString
  },
  type: {
    type: String,
    enum: {
      values: VALID_NOTIFICATION_TYPES,
      message: 'Invalid notification type.'
    },
    default: 'info',
    set: sanitizeString
  },
  priority: {
    type: String,
    enum: {
      values: VALID_PRIORITIES,
      message: 'Invalid priority value.'
    },
    default: 'medium',
    set: sanitizeString
  },
  read: {
    type: Boolean,
    default: false
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 24*60*60*1000), // 24 hours from creation
    index: { expires: 0 }
  },
  // Version number for notification changes
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  // Change history for versioning
  changeHistory: [{
    version: { type: Number, required: true },
    changes: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Pre-save middleware to handle versioning
notificationSchema.pre('save', function(next) {
  // If this is an update and message, type, or priority have changed, increment version
  if (!this.isNew && (this.isModified('message') || this.isModified('type') || this.isModified('priority'))) {
    this.version += 1;
    this.changeHistory.push({
      version: this.version,
      changes: 'Notification message, type, or priority updated',
      changedAt: new Date()
    });
  }
  // Limit change history to last 10 versions
  if (this.changeHistory.length > 10) {
    this.changeHistory = this.changeHistory.slice(-10);
  }
  next();
});

// Database indexes for optimized query performance
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ version: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });

// Compound indexes for complex queries
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ userId: 1, priority: 1 });

// Static method to find notifications by user and version
notificationSchema.statics.findByUserAndVersion = function(userId, version = 1) {
  return this.find({ userId, version });
};

// Static method to get latest version of a notification for a user
notificationSchema.statics.findLatestByUser = function(userId) {
  return this.find({ userId }).sort({ version: -1 });
};

// Instance method to create a new version
notificationSchema.methods.createNewVersion = function(changes, changedBy) {
  const newVersion = new this.constructor({
    ...this.toObject(),
    _id: undefined, // Remove _id to create new document
    version: this.version + 1,
    changeHistory: [{
      version: this.version + 1,
      changes,
      changedBy,
      changedAt: new Date()
    }]
  });
  return newVersion.save();
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

// End of Notification.js
// Description: End of notification model file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 