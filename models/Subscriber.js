/*
 * File: Subscriber.js
 * Description: Mongoose schema for newsletter/email subscribers in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const mongoose = require('mongoose');

// Valid status values for subscribers
const VALID_SUBSCRIBER_STATUSES = ['active', 'inactive'];
// Valid source values
const VALID_SOURCES = ['website', 'import', 'api'];

// Sanitize string input to prevent injection attacks
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.]/g, '').trim();
};

const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address'],
    set: sanitizeString
  },
  status: {
    type: String,
    enum: {
      values: VALID_SUBSCRIBER_STATUSES,
      message: 'Invalid subscriber status.'
    },
    default: 'active',
    set: sanitizeString
  },
  unsubscribedAt: {
    type: Date
  },
  source: {
    type: String,
    enum: {
      values: VALID_SOURCES,
      message: 'Invalid source value.'
    },
    default: 'website',
    set: sanitizeString
  },
  // Version number for subscriber changes
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
subscriberSchema.pre('save', function(next) {
  // If this is an update and status or source have changed, increment version
  if (!this.isNew && (this.isModified('status') || this.isModified('source'))) {
    this.version += 1;
    this.changeHistory.push({
      version: this.version,
      changes: 'Subscriber status or source updated',
      changedAt: new Date()
    });
  }
  // Limit change history to last 10 versions
  if (this.changeHistory.length > 10) {
    this.changeHistory = this.changeHistory.slice(-10);
  }
  next();
});

// Index for faster email lookups and performance
subscriberSchema.index({ email: 1 });
subscriberSchema.index({ status: 1 });
subscriberSchema.index({ source: 1 });
subscriberSchema.index({ version: 1 });
subscriberSchema.index({ createdAt: -1 });

// Compound indexes for complex queries
subscriberSchema.index({ status: 1, source: 1 });
subscriberSchema.index({ email: 1, version: 1 });

// Static method to find subscribers by email and version
subscriberSchema.statics.findByEmailAndVersion = function(email, version = 1) {
  return this.findOne({ email, version });
};

// Static method to get latest version of a subscriber
subscriberSchema.statics.findLatestByEmail = function(email) {
  return this.findOne({ email }).sort({ version: -1 });
};

// Instance method to create a new version
subscriberSchema.methods.createNewVersion = function(changes, changedBy) {
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

module.exports = mongoose.model('Subscriber', subscriberSchema);

// End of Subscriber.js
// Description: End of subscriber model file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 