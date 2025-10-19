/*
 * File: Newsletter.js
 * Description: Mongoose schema for newsletters, scheduling, and delivery tracking in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const mongoose = require('mongoose');

// Valid content types
const VALID_CONTENT_TYPES = ['text', 'html'];
// Valid status values
const VALID_STATUSES = ['draft', 'scheduled', 'sent'];
// Valid schedule frequencies
const VALID_FREQUENCIES = ['once', 'daily', 'weekly', 'monthly', 'custom'];
// Valid sentTo status
const VALID_SENT_STATUS = ['success', 'failed'];

// Sanitize string input to prevent injection attacks
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.,]/g, '').trim();
};

// Newsletter Schema
const newsletterSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'Newsletter subject is required'],
    trim: true,
    set: sanitizeString
  },
  content: {
    type: String,
    required: [true, 'Newsletter content is required'],
    set: sanitizeString
  },
  contentType: {
    type: String,
    enum: {
      values: VALID_CONTENT_TYPES,
      message: 'Invalid content type.'
    },
    default: 'html',
    set: sanitizeString
  },
  status: {
    type: String,
    enum: {
      values: VALID_STATUSES,
      message: 'Invalid status value.'
    },
    default: 'draft',
    set: sanitizeString
  },
  schedule: {
    frequency: {
      type: String,
      enum: {
        values: VALID_FREQUENCIES,
        message: 'Invalid schedule frequency.'
      },
      set: sanitizeString
    },
    scheduleTime: { type: String, set: sanitizeString },
    startDate: Date,
    endDate: Date,
    customDates: [Date],
    nextSendDate: Date,
    lastSentDate: Date,
    weekdays: [Number] // <-- Added for weekly scheduling
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  sentTo: [{
    email: { type: String, set: sanitizeString },
    sentAt: Date,
    status: {
      type: String,
      enum: {
        values: VALID_SENT_STATUS,
        message: 'Invalid sent status.'
      },
      set: sanitizeString
    },
    error: { type: String, set: sanitizeString }
  }],
  // Version number for newsletter changes
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

// Pre-save middleware to update timestamps and handle versioning
newsletterSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Validate schedule if it exists
  if (this.schedule) {
    // If schedule has any fields, frequency is required
    if (this.schedule.scheduleTime || this.schedule.startDate || this.schedule.nextSendDate) {
      if (!this.schedule.frequency || !VALID_FREQUENCIES.includes(this.schedule.frequency)) {
        return next(new Error('Schedule frequency is required and must be one of: ' + VALID_FREQUENCIES.join(', ')));
      }
    }
  }
  
  // If this is an update and content, status, or schedule have changed, increment version
  if (!this.isNew && (this.isModified('content') || this.isModified('status') || this.isModified('schedule'))) {
    this.version += 1;
    this.changeHistory.push({
      version: this.version,
      changes: 'Newsletter content, status, or schedule updated',
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
newsletterSchema.index({ subject: 1 });
newsletterSchema.index({ status: 1 });
newsletterSchema.index({ createdBy: 1 });
newsletterSchema.index({ version: 1 });
newsletterSchema.index({ createdAt: -1 });

// Compound indexes for complex queries
newsletterSchema.index({ status: 1, createdBy: 1 });
newsletterSchema.index({ subject: 1, version: 1 });

// Static method to find newsletters by subject and version
newsletterSchema.statics.findBySubjectAndVersion = function(subject, version = 1) {
  return this.findOne({ subject, version });
};

// Static method to get latest version of a newsletter
newsletterSchema.statics.findLatestBySubject = function(subject) {
  return this.findOne({ subject }).sort({ version: -1 });
};

// Instance method to create a new version
newsletterSchema.methods.createNewVersion = function(changes, changedBy) {
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

const Newsletter = mongoose.model('Newsletter', newsletterSchema);

module.exports = Newsletter;

// End of Newsletter.js
// Description: End of newsletter model file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 