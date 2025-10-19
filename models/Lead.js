 /*
 * File: Lead.js
 * Description: Mongoose schema for managing leads, meetings, and status tracking in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const mongoose = require('mongoose');

// Valid meeting durations
const VALID_DURATIONS = ['30 minutes', '1 hour', '1.5 hours', '2 hours'];
// Valid meeting location types
const VALID_LOCATION_TYPES = ['virtual', 'offline'];
// Valid meeting platforms
const VALID_PLATFORMS = ['meet', 'zoom'];
// Valid meeting status
const VALID_MEETING_STATUSES = ['scheduled', 'completed', 'cancelled'];
// Valid lead status
const VALID_LEAD_STATUSES = ['new', 'contacted', 'qualified', 'lost', 'rejected'];
// Valid lead sources
const VALID_SOURCES = ['website', 'social', 'referral', 'other'];

// Sanitize string input to prevent injection attacks
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.,]/g, '').trim();
};

// Meeting schema for lead meetings
const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Meeting title is required'],
    trim: true,
    set: sanitizeString
  },
  description: {
    type: String,
    required: [true, 'Meeting description is required'],
    trim: true,
    set: sanitizeString
  },
  dateTime: {
    type: Date,
    required: [true, 'Meeting date and time is required']
  },
  duration: {
    type: String,
    required: [true, 'Meeting duration is required'],
    enum: {
      values: VALID_DURATIONS,
      message: 'Invalid duration selected'
    },
    set: sanitizeString
  },
  locationType: {
    type: String,
    enum: {
      values: VALID_LOCATION_TYPES,
      message: 'Meeting type must be either virtual or offline'
    },
    required: [true, 'Meeting type is required'],
    set: sanitizeString
  },
  location: {
    type: String,
    required: [
      function() { return this.locationType === 'offline'; },
      'Location is required for offline meetings'
    ],
    trim: true,
    set: sanitizeString
  },
  platform: {
    type: String,
    enum: {
      values: VALID_PLATFORMS,
      message: 'Platform must be either Google Meet or Zoom'
    },
    required: [
      function() { return this.locationType === 'virtual'; },
      'Platform is required for virtual meetings'
    ],
    set: sanitizeString
  },
  meetingLink: {
    type: String,
    required: [
      function() { return this.locationType === 'virtual'; },
      'Meeting link is required for virtual meetings'
    ],
    trim: true,
    set: sanitizeString,
    validate: {
      validator: function(v) {
        if (this.locationType !== 'virtual') return true;
        const patterns = {
          meet: /^https:\/\/meet\.google\.com\/[a-z0-9\-]+$/i,
          zoom: /^https:\/\/[a-z0-9-.]+\.zoom\.us\/j\/[0-9]+$/i
        };
        return patterns[this.platform] ? patterns[this.platform].test(v) : false;
      },
      message: props => `Invalid meeting link format for the selected platform`
    }
  },
  agenda: {
    type: String,
    trim: true,
    set: sanitizeString
  },
  scheduledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Meeting scheduler is required']
  },
  status: {
    type: String,
    enum: {
      values: VALID_MEETING_STATUSES,
      message: 'Invalid meeting status'
    },
    default: 'scheduled',
    set: sanitizeString
  }
}, { 
  timestamps: true,
  _id: true
});

// Status history schema for lead status changes
const statusHistorySchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true,
    set: sanitizeString
  },
  clientEmail: {
    type: String,
    required: true,
    set: sanitizeString
  },
  company: {
    type: String,
    default: 'N/A',
    set: sanitizeString
  },
  status: {
    type: String,
    enum: {
      values: VALID_LEAD_STATUSES,
      message: 'Invalid status value.'
    },
    required: true,
    set: sanitizeString
  },
  feedback: {
    type: String,
    required: true,
    set: sanitizeString
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Main lead schema
const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
    set: sanitizeString
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    set: sanitizeString
  },
  phone: {
    type: String,
    trim: true,
    set: sanitizeString
  },
  company: {
    type: String,
    trim: true,
    set: sanitizeString
  },
  message: {
    type: String,
    trim: true,
    set: sanitizeString
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
  status: {
    type: String,
    enum: {
      values: VALID_LEAD_STATUSES,
      message: 'Invalid status value.'
    },
    default: 'new',
    set: sanitizeString
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  feedback: { type: String, set: sanitizeString },
  statusHistory: [statusHistorySchema],
  meetings: [meetingSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: Map,
    of: String,
    default: () => ({})
  },
  // Version number for lead changes
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save middleware to handle versioning and status history
leadSchema.pre('save', function(next) {
  if (!this.statusHistory) {
    this.statusHistory = [];
  }
  // If this is an update and status, meetings, or feedback have changed, increment version
  if (!this.isNew && (this.isModified('status') || this.isModified('meetings') || this.isModified('feedback'))) {
    this.version += 1;
    this.changeHistory.push({
      version: this.version,
      changes: 'Lead status, meetings, or feedback updated',
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
leadSchema.index({ email: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ version: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ createdBy: 1 });
leadSchema.index({ updatedBy: 1 });

// Compound indexes for complex queries
leadSchema.index({ status: 1, assignedTo: 1 });
leadSchema.index({ status: 1, createdBy: 1 });

// Static method to find leads by email and version
leadSchema.statics.findByEmailAndVersion = function(email, version = 1) {
  return this.findOne({ email, version });
};

// Static method to get latest version of a lead
leadSchema.statics.findLatestByEmail = function(email) {
  return this.findOne({ email }).sort({ version: -1 });
};

// Instance method to create a new version
leadSchema.methods.createNewVersion = function(changes, changedBy) {
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

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;

// End of Lead.js
// Description: End of lead model file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 