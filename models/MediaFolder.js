/*
 * File: MediaFolder.js
 * Description: Mongoose schema for media folders and directory structure in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const mongoose = require('mongoose');

// Sanitize string input to prevent injection attacks
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s.]/g, '').trim();
};

// Main media folder schema
const mediaFolderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    set: sanitizeString,
    validate: {
      validator: function(name) {
        return name && name.length > 0 && name.length <= 100;
      },
      message: 'Folder name must be 1-100 characters.'
    }
  },
  description: {
    type: String,
    trim: true,
    set: sanitizeString
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MediaFolder'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Version number for folder changes
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
mediaFolderSchema.pre('save', function(next) {
  // If this is an update and name or description have changed, increment version
  if (!this.isNew && (this.isModified('name') || this.isModified('description'))) {
    this.version += 1;
    this.changeHistory.push({
      version: this.version,
      changes: 'Folder name or description updated',
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
mediaFolderSchema.index({ name: 1 });
mediaFolderSchema.index({ parent: 1 });
mediaFolderSchema.index({ createdBy: 1 });
mediaFolderSchema.index({ version: 1 });
mediaFolderSchema.index({ createdAt: -1 });

// Compound indexes for complex queries
mediaFolderSchema.index({ parent: 1, name: 1 });
mediaFolderSchema.index({ name: 1, version: 1 });

// Static method to find folders by name and version
mediaFolderSchema.statics.findByNameAndVersion = function(name, version = 1) {
  return this.findOne({ name, version });
};

// Static method to get latest version of a folder
mediaFolderSchema.statics.findLatestByName = function(name) {
  return this.findOne({ name }).sort({ version: -1 });
};

// Instance method to create a new version
mediaFolderSchema.methods.createNewVersion = function(changes, changedBy) {
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

const MediaFolder = mongoose.model('MediaFolder', mediaFolderSchema);

module.exports = MediaFolder;

// End of MediaFolder.js
// Description: End of media folder model file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 