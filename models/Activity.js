/*
 * File: Activity.js
 * Description: Mongoose schema for tracking user activities and system events in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const mongoose = require('mongoose');

// Valid action types for activity tracking
const VALID_ACTIONS = [
  'create', 'update', 'delete', 'view', 
  'login', 'logout', 'status_change', 
  'meeting_scheduled', 'search', 'filter', 
  'export', 'import', 'download', 'upload',
  'approve', 'reject', 'comment', 'share',
  'publish', 'unpublish', 'archive', 'restore'
];

// Valid entity types for activity tracking
const VALID_ENTITIES = [
  'lead', 'user', 'meeting', 'auth', 
  'activity', 'notification', 'system',
  'layout', 'page', 'component', 'blog',
  'newsletter', 'cms', 'file', 'comment'
];

// Valid status values for activity
const VALID_STATUSES = ['success', 'failed', 'pending'];

// Sanitize string input to prevent injection attacks
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
};

// Schema for tracking user activities and system events
const activitySchema = new mongoose.Schema({
  // Reference to the user who performed the action
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Type of action performed (create, update, delete, etc.)
  action: {
    type: String,
    required: true,
    enum: {
      values: VALID_ACTIONS,
      message: 'Invalid action type.'
    },
    set: sanitizeString
  },
  // Entity type that was affected (user, page, component, etc.)
  entity: {
    type: String,
    required: true,
    enum: {
      values: VALID_ENTITIES,
      message: 'Invalid entity type.'
    },
    set: sanitizeString
  },
  // ID of the specific entity that was affected (optional)
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  // Additional details about the activity (request data, response, etc.)
  details: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: () => ({})
  },
  // IP address of the user who performed the action
  ipAddress: {
    type: String,
    set: sanitizeString
  },
  // User agent string for browser/client identification
  userAgent: {
    type: String,
    set: sanitizeString
  },
  // Status of the activity (success, failed, pending)
  status: {
    type: String,
    enum: {
      values: VALID_STATUSES,
      message: 'Invalid status value.'
    },
    default: 'success',
    set: sanitizeString
  },
  // Error message if the activity failed
  error: {
    type: String,
    set: sanitizeString
  },
  // Version number for activity changes
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
  timestamps: true // Automatically add createdAt and updatedAt fields
});

// Pre-save middleware to handle versioning
activitySchema.pre('save', function(next) {
  // If this is an update and details or status have changed, increment version
  if (!this.isNew && (this.isModified('details') || this.isModified('status'))) {
    this.version += 1;
    this.changeHistory.push({
      version: this.version,
      changes: 'Activity details or status updated',
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
activitySchema.index({ user: 1 });           // Index for user-based queries
activitySchema.index({ action: 1 });         // Index for action-based queries
activitySchema.index({ entity: 1 });         // Index for entity-based queries
activitySchema.index({ createdAt: -1 });     // Index for time-based queries (descending)
activitySchema.index({ status: 1 });         // Index for status-based queries
activitySchema.index({ entityId: 1 });       // Index for entityId queries
activitySchema.index({ version: 1 });        // Index for version queries

// Compound indexes for complex queries
activitySchema.index({ user: 1, action: 1, entity: 1 });
activitySchema.index({ entity: 1, status: 1 });

// Static method to find activities by user and version
activitySchema.statics.findByUserAndVersion = function(userId, version = 1) {
  return this.find({ user: userId, version });
};

// Static method to get latest version of an activity
activitySchema.statics.findLatestByUser = function(userId) {
  return this.find({ user: userId }).sort({ version: -1 });
};

// Instance method to create a new version
activitySchema.methods.createNewVersion = function(changes, changedBy) {
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

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;

// End of Activity.js
// Description: End of activity model file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private.