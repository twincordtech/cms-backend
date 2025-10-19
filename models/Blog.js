/*
 * File: Blog.js
 * Description: Mongoose schema for blog posts and articles in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const mongoose = require('mongoose');

// Valid status values for blog posts
const VALID_STATUSES = ['draft', 'published'];

// Sanitize string input to prevent injection attacks
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
};

// Sanitize array of strings
const sanitizeStringArray = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map(sanitizeString);
};

// Schema for blog posts and articles
const blogSchema = new mongoose.Schema({
  // Title of the blog post
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    set: sanitizeString
  },
  // URL-friendly slug for the blog post
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    trim: true,
    set: sanitizeString
  },
  // Main content of the blog post
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  // Short excerpt/summary of the blog post
  excerpt: {
    type: String,
    maxlength: [500, 'Excerpt cannot be more than 500 characters'],
    set: sanitizeString
  },
  // Featured image for the blog post
  featuredImage: {
    url: { type: String, set: sanitizeString },
    alt: { type: String, set: sanitizeString },
    caption: { type: String, set: sanitizeString }
  },
  // Author information
  author: {
    name: { type: String, set: sanitizeString },
    role: { type: String, set: sanitizeString },
    avatar: { type: String, set: sanitizeString }
  },
  // Categories for organizing blog posts
  categories: [{
    type: String,
    trim: true,
    set: sanitizeString
  }],
  // Tags for better searchability
  tags: [{
    type: String,
    trim: true,
    set: sanitizeString
  }],
  // Publication status of the blog post
  status: {
    type: String,
    enum: {
      values: VALID_STATUSES,
      message: 'Invalid status value.'
    },
    default: 'draft',
    set: sanitizeString
  },
  // Date when the blog post was published
  publishedAt: {
    type: Date
  },
  // SEO metadata for the blog post
  seo: {
    metaTitle: { type: String, set: sanitizeString },
    metaDescription: { type: String, set: sanitizeString },
    keywords: [{ type: String, set: sanitizeString }],
    ogImage: { type: String, set: sanitizeString }
  },
  // Estimated reading time in minutes
  readTime: {
    type: Number,
    default: 0
  },
  // Number of views for the blog post
  views: {
    type: Number,
    default: 0
  },
  // Number of likes for the blog post
  likes: {
    type: Number,
    default: 0
  },
  // User who created the blog post
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // User who last updated the blog post
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Version number for blog changes
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
  timestamps: true, // Automatically add createdAt and updatedAt fields
  toJSON: { virtuals: true }, // Include virtual fields when converting to JSON
  toObject: { virtuals: true } // Include virtual fields when converting to object
});

// Pre-save middleware to calculate reading time and handle versioning
blogSchema.pre('save', function(next) {
  const wordsPerMinute = 200; // Average reading speed
  const wordCount = this.content ? this.content.split(/\s+/).length : 0; // Count words in content
  this.readTime = Math.ceil(wordCount / wordsPerMinute); // Calculate reading time
  // If this is an update and content or status has changed, increment version
  if (!this.isNew && (this.isModified('content') || this.isModified('status'))) {
    this.version += 1;
    this.changeHistory.push({
      version: this.version,
      changes: 'Blog content or status updated',
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
blogSchema.index({ title: 'text', content: 'text', 'author.name': 'text' }); // Text search index
blogSchema.index({ slug: 1 }, { unique: true }); // Unique index for slug
blogSchema.index({ status: 1, publishedAt: -1 }); // Index for published posts by date
blogSchema.index({ categories: 1 }); // Index for category-based queries
blogSchema.index({ tags: 1 }); // Index for tag-based queries
blogSchema.index({ version: 1 }); // Index for version queries
blogSchema.index({ createdBy: 1 }); // Index for creator queries
blogSchema.index({ updatedBy: 1 }); // Index for updater queries

// Compound indexes for complex queries
blogSchema.index({ status: 1, tags: 1 });
blogSchema.index({ status: 1, categories: 1 });

// Virtual field for comments (if comment system is implemented)
blogSchema.virtual('comments', {
  ref: 'Comment', // Reference to Comment model
  localField: '_id', // Field in this document
  foreignField: 'blog' // Field in the referenced document
});

// Static method to find blogs by status and version
blogSchema.statics.findByStatusAndVersion = function(status, version = 1) {
  return this.find({ status, version });
};

// Static method to get latest version of a blog post
blogSchema.statics.findLatestBySlug = function(slug) {
  return this.findOne({ slug }).sort({ version: -1 });
};

// Instance method to create a new version
blogSchema.methods.createNewVersion = function(changes, changedBy) {
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

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;

// End of Blog.js
// Description: End of blog model file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 