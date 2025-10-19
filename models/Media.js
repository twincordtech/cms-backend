/*
 * File: Media.js
 * Description: Mongoose schema for media files and assets in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const mongoose = require('mongoose');

// Valid media types
const VALID_MEDIA_TYPES = ['image', 'video', 'document', 'other'];

// Sanitize string input to prevent injection attacks
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s.]/g, '').trim();
};

// Main media schema
const mediaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    set: sanitizeString,
    validate: {
      validator: function(name) {
        return name && name.length > 0 && name.length <= 200;
      },
      message: 'Media name must be 1-200 characters.'
    }
  },
  description: {
    type: String,
    trim: true,
    set: sanitizeString
  },
  type: {
    type: String,
    required: true,
    enum: {
      values: VALID_MEDIA_TYPES,
      message: 'Invalid media type.'
    },
    set: sanitizeString
  },
  url: {
    type: String,
    required: true,
    set: sanitizeString
  },
  thumbnailUrl: {
    type: String,
    set: sanitizeString
  },
  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MediaFolder',
    required: true
  },
  size: {
    type: Number,
    required: true,
    min: 0
  },
  mimeType: {
    type: String,
    required: true,
    set: sanitizeString
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Version number for media changes
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
mediaSchema.pre('save', function(next) {
  // If this is an update and url, description, or type have changed, increment version
  if (!this.isNew && (this.isModified('url') || this.isModified('description') || this.isModified('type'))) {
    this.version += 1;
    this.changeHistory.push({
      version: this.version,
      changes: 'Media url, description, or type updated',
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
mediaSchema.index({ name: 1 });
mediaSchema.index({ type: 1 });
mediaSchema.index({ folder: 1 });
mediaSchema.index({ uploadedBy: 1 });
mediaSchema.index({ version: 1 });
mediaSchema.index({ createdAt: -1 });

// Compound indexes for complex queries
mediaSchema.index({ folder: 1, type: 1 });
mediaSchema.index({ name: 1, version: 1 });

// Static method to find media by name and version
mediaSchema.statics.findByNameAndVersion = function(name, version = 1) {
  return this.findOne({ name, version });
};

// Static method to get latest version of a media file
mediaSchema.statics.findLatestByName = function(name) {
  return this.findOne({ name }).sort({ version: -1 });
};

// Instance method to create a new version
mediaSchema.methods.createNewVersion = function(changes, changedBy) {
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

const Media = mongoose.model('Media', mediaSchema);

module.exports = Media;

// End of Media.js
// Description: End of media model file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 