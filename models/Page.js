/*
 * File: Page.js
 * Description: Mongoose schema for CMS pages, metadata, and layout references.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const mongoose = require('mongoose');

// Valid status values for pages
const VALID_PAGE_STATUSES = ['draft', 'published', 'archived'];

// Sanitize string input to prevent injection attacks
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s/]/g, '').trim();
};

const pageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide page title'],
    trim: true,
    set: sanitizeString
  },
  slug: {
    type: String,
    required: [true, 'Please provide page slug'],
    unique: true,
    trim: true,
    set: sanitizeString
  },
  status: {
    type: String,
    enum: {
      values: VALID_PAGE_STATUSES,
      message: 'Invalid page status.'
    },
    default: 'draft',
    set: sanitizeString
  },
  isActive: {
    type: Boolean,
    default: true,
    description: 'Indicates if the page is publicly visible'
  },
  isMultiPage: {
    type: Boolean,
    default: false,
    description: 'Indicates if this is a dynamic page that can have multiple instances'
  },
  layout: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Layout',
  },
  apiEndpoint: {
    type: String,
    default: function() {
      return `/api/cms/pages/${this.slug}/content`;
    },
    set: sanitizeString
  },
  order: {
    type: Number,
    default: 0
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
  metadata: {
    keywords: [{ type: String, set: sanitizeString }]
  },
  // Version number for page changes
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
}, { timestamps: true });

// Pre-save middleware to generate API endpoint and handle versioning
pageSchema.pre('save', function(next) {
  if (!this.apiEndpoint) {
    this.apiEndpoint = `/api/cms/pages/${this.slug}/content`;
  }
  // If this is an update and title, status, or meta fields have changed, increment version
  if (!this.isNew && (this.isModified('title') || this.isModified('status') || this.isModified('metaTitle') || this.isModified('metaDescription'))) {
    this.version += 1;
    this.changeHistory.push({
      version: this.version,
      changes: 'Page title, status, or meta fields updated',
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
pageSchema.index({ slug: 1 }, { unique: true });
pageSchema.index({ status: 1 });
pageSchema.index({ isActive: 1 });
pageSchema.index({ layout: 1 });
pageSchema.index({ version: 1 });
pageSchema.index({ createdAt: -1 });

// Compound indexes for complex queries
pageSchema.index({ status: 1, isActive: 1 });
pageSchema.index({ slug: 1, version: 1 });

// Static method to find pages by slug and version
pageSchema.statics.findBySlugAndVersion = function(slug, version = 1) {
  return this.findOne({ slug, version });
};

// Static method to get latest version of a page
pageSchema.statics.findLatestBySlug = function(slug) {
  return this.findOne({ slug }).sort({ version: -1 });
};

// Instance method to create a new version
pageSchema.methods.createNewVersion = function(changes, changedBy) {
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

const Page = mongoose.model('Page', pageSchema);

module.exports = Page;

// End of Page.js
// Description: End of page model file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 