/*
 * File: PageInstance.js
 * Description: Mongoose schema for page instances, dynamic content, and metadata in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const mongoose = require('mongoose');

// Valid status values for page instances
const VALID_INSTANCE_STATUSES = ['draft', 'published', 'archived'];

// Sanitize string input to prevent injection attacks
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s/]/g, '').trim();
};

const pageInstanceSchema = new mongoose.Schema({
  page: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Page',
    required: [true, 'Page reference is required']
  },
  title: {
    type: String,
    required: [true, 'Instance title is required'],
    trim: true,
    set: sanitizeString
  },
  metaTitle: {
    type: String,
    default: '',
    set: sanitizeString
  },
  metaDescription: {
    type: String, 
    default: '',
    set: sanitizeString
  },
  slug: {
    type: String,
    required: [true, 'Instance slug is required'],
    unique: true,
    trim: true,
    set: sanitizeString
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: {
      values: VALID_INSTANCE_STATUSES,
      message: 'Invalid instance status.'
    },
    default: 'draft',
    set: sanitizeString
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Version number for page instance changes
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

// Pre-save middleware to ensure slug is unique within the page and handle versioning
pageInstanceSchema.pre('save', async function(next) {
  if (this.isModified('slug')) {
    const existingInstance = await this.constructor.findOne({
      page: this.page,
      slug: this.slug,
      _id: { $ne: this._id }
    });
    if (existingInstance) {
      throw new Error('Slug must be unique within the page');
    }
  }
  // If this is an update and title, status, or meta fields have changed, increment version
  if (!this.isNew && (this.isModified('title') || this.isModified('status') || this.isModified('metaTitle') || this.isModified('metaDescription'))) {
    this.version += 1;
    this.changeHistory.push({
      version: this.version,
      changes: 'Instance title, status, or meta fields updated',
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
pageInstanceSchema.index({ page: 1, slug: 1 }, { unique: true });
pageInstanceSchema.index({ status: 1 });
pageInstanceSchema.index({ createdAt: -1 });
pageInstanceSchema.index({ version: 1 });
pageInstanceSchema.index({ createdBy: 1 });
pageInstanceSchema.index({ updatedBy: 1 });

// Compound indexes for complex queries
pageInstanceSchema.index({ page: 1, status: 1 });
pageInstanceSchema.index({ slug: 1, version: 1 });

// Static method to find page instances by slug and version
pageInstanceSchema.statics.findBySlugAndVersion = function(slug, version = 1) {
  return this.findOne({ slug, version });
};

// Static method to get latest version of a page instance
pageInstanceSchema.statics.findLatestBySlug = function(slug) {
  return this.findOne({ slug }).sort({ version: -1 });
};

// Instance method to create a new version
pageInstanceSchema.methods.createNewVersion = function(changes, changedBy) {
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

const PageInstance = mongoose.model('PageInstance', pageInstanceSchema);

module.exports = PageInstance;

// End of PageInstance.js
// Description: End of page instance model file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 