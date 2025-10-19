/*
 * File: Section.js
 * Description: Mongoose schema for page sections, layouts, and content blocks in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const mongoose = require('mongoose');

// Valid section types
const VALID_SECTION_TYPES = ['banner', 'content', 'grid', 'two-column', 'three-column', 'four-column'];

// Sanitize string input to prevent injection attacks
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
};

const SectionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Section type is required'],
    enum: {
      values: VALID_SECTION_TYPES,
      message: 'Invalid section type.'
    },
    set: sanitizeString
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Section data is required']
  },
  pageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Page',
    required: [true, 'Page association is required']
  },
  order: {
    type: Number,
    required: true,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Version number for section changes
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
});

// Add index for faster page-based queries
SectionSchema.index({ pageId: 1, order: 1 });
SectionSchema.index({ pageId: 1, isActive: 1 });
SectionSchema.index({ version: 1 });
SectionSchema.index({ createdBy: 1 });
SectionSchema.index({ updatedBy: 1 });
SectionSchema.index({ createdAt: -1 });

// Compound indexes for complex queries
SectionSchema.index({ pageId: 1, type: 1 });
SectionSchema.index({ pageId: 1, version: 1 });

// Schema validation for different section types and versioning
SectionSchema.pre('save', function(next) {
  const section = this;
  // Validate data based on section type
  if (section.type === 'banner') {
    if (!section.data.title || !section.data.imageURL) {
      return next(new Error('Banner requires title and imageURL'));
    }
  } else if (section.type === 'content') {
    if (!section.data.htmlContent) {
      return next(new Error('Content section requires htmlContent'));
    }
  } else if (section.type === 'grid') {
    if (!Array.isArray(section.data.cards) || section.data.cards.length === 0) {
      return next(new Error('Grid section requires at least one card'));
    }
  } else if (section.type === 'two-column') {
    if (!section.data.title || !Array.isArray(section.data.fields) || section.data.fields.length !== 2) {
      return next(new Error('Two-column layout requires title and exactly 2 fields'));
    }
  } else if (section.type === 'three-column') {
    if (!section.data.title || !Array.isArray(section.data.fields) || section.data.fields.length !== 3) {
      return next(new Error('Three-column layout requires title and exactly 3 fields'));
    }
  } else if (section.type === 'four-column') {
    if (!section.data.title || !Array.isArray(section.data.fields) || section.data.fields.length !== 4) {
      return next(new Error('Four-column layout requires title and exactly 4 fields'));
    }
  }
  // Store version history and increment version if data changed
  if (section.isModified('data')) {
    section.version += 1;
    section.changeHistory.push({
      version: section.version,
      changes: 'Section data updated',
      changedBy: section.updatedBy || section.createdBy,
      changedAt: new Date()
    });
  }
  // Limit change history to last 10 versions
  if (section.changeHistory && section.changeHistory.length > 10) {
    section.changeHistory = section.changeHistory.slice(-10);
  }
  // Update timestamp
  section.updatedAt = Date.now();
  next();
});

// Static method to find sections by page and version
SectionSchema.statics.findByPageAndVersion = function(pageId, version = 1) {
  return this.findOne({ pageId, version });
};

// Static method to get latest version of a section for a page
SectionSchema.statics.findLatestByPage = function(pageId) {
  return this.findOne({ pageId }).sort({ version: -1 });
};

// Instance method to create a new version
SectionSchema.methods.createNewVersion = function(changes, changedBy) {
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

module.exports = mongoose.model('Section', SectionSchema);

// End of Section.js
// Description: End of section model file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private.