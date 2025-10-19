/*
 * File: User.js
 * Description: Mongoose schema for user accounts, authentication, and roles in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Valid user roles
const VALID_USER_ROLES = ['user', 'admin', 'viewer'];

// Sanitize string input to prevent injection attacks
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.]/g, '').trim();
};

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    // required: [true, 'Please provide a name'],
    trim: true,
    set: sanitizeString
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    set: sanitizeString
  },
  mobile: {
    type: String,
    // required: [true, 'Please provide a mobile number'],
    trim: true,
    set: sanitizeString
  },
  role: {
    type: String,
    enum: {
      values: VALID_USER_ROLES,
      message: 'Invalid user role.'
    },
    default: 'user',
    set: sanitizeString
  },
  company: {
    type: String,
    trim: true,
    default: '',
    set: sanitizeString
  },
  designation: {
    type: String,
    trim: true,
    default: '',
    set: sanitizeString
  },
  department: {
    type: String,
    trim: true,
    default: '',
    set: sanitizeString
  },
  password: {
    type: String,
    select: false
  },
  passwordHash: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  verificationToken: {
    type: String,
    set: sanitizeString
  },
  tokenExpiry: Date,
  passwordResetToken: {
    type: String,
    set: sanitizeString
  },
  passwordResetExpiry: Date,
  refreshToken: {
    type: String,
    set: sanitizeString
  },
  refreshTokenExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Version number for user changes
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

// Method to check if password matches
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Hash password before saving if it's modified
UserSchema.pre('save', async function(next) {
  // Hash password if it exists and was modified
  if (this.password && this.isModified('password')) {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.password, salt);
    this.password = undefined; // Remove plain password field
  }
  
  this.updatedAt = Date.now();
  // If this is an update and name, email, or role have changed, increment version
  if (!this.isNew && (this.isModified('name') || this.isModified('email') || this.isModified('role'))) {
    this.version += 1;
    this.changeHistory.push({
      version: this.version,
      changes: 'User name, email, or role updated',
      changedAt: new Date()
    });
  }
  // Limit change history to last 10 versions
  if (this.changeHistory && this.changeHistory.length > 10) {
    this.changeHistory = this.slice(-10);
  }
  next();
});

// Database indexes for optimized query performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ version: 1 });
UserSchema.index({ createdAt: -1 });

// Compound indexes for complex queries
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ email: 1, version: 1 });

// Static method to find users by email and version
UserSchema.statics.findByEmailAndVersion = function(email, version = 1) {
  return this.findOne({ email, version });
};

// Static method to get latest version of a user
UserSchema.statics.findLatestByEmail = function(email) {
  return this.findOne({ email }).sort({ version: -1 });
};

// Instance method to create a new version
UserSchema.methods.createNewVersion = function(changes, changedBy) {
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

module.exports = mongoose.model('User', UserSchema); 

// End of User.js
// Description: End of user model file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 