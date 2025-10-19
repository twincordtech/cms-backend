/*
 * File: Inquiry.js
 * Description: Mongoose schema for customer inquiries, meetings, and status tracking in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const mongoose = require('mongoose');

// Valid status values for inquiry and status history
const VALID_STATUSES = ['new', 'contacted', 'qualified', 'closed', 'rejected'];
// Valid meeting durations
const VALID_DURATIONS = ['30 minutes', '1 hour', '1.5 hours', '2 hours'];
// Valid meeting location types
const VALID_LOCATION_TYPES = ['virtual', 'offline'];
// Valid meeting platforms
const VALID_PLATFORMS = ['meet', 'zoom'];
// Valid meeting status
const VALID_MEETING_STATUSES = ['scheduled', 'completed', 'cancelled'];
// Valid interests
const VALID_INTERESTS = ['business', 'personal'];
// Valid inquiry types
const VALID_INQUIRY_TYPES = [
  'general', 'support', 'sales', 'technical', 'billing', 'account', 'product',
  'service', 'consulting', 'integration', 'migration', 'cloud', 'security',
  'performance', 'bug', 'feature_request', 'feedback', 'partnership', 'training',
  'demo', 'other'
];

// Sanitize string input to prevent injection attacks
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.,]/g, '').trim();
};

// Status history schema for inquiry status changes
const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: {
      values: VALID_STATUSES,
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

// Meeting schema for inquiry meetings
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

// Main inquiry schema
const inquirySchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    set: sanitizeString
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    set: sanitizeString
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    set: sanitizeString
  },
  telephone: {
    type: String,
    trim: true,
    set: sanitizeString
  },
  jobRole: {
    type: String,
    trim: true,
    set: sanitizeString
  },
  companyName: {
    type: String,
    trim: true,
    set: sanitizeString
  },
  companyType: {
    type: String,
    trim: true,
    set: sanitizeString
  },
  industry: {
    type: String,
    trim: true,
    set: sanitizeString
  },
  country: {
    type: String,
    trim: true,
    set: sanitizeString
  },
  state: {
    type: String,
    trim: true,
    set: sanitizeString
  },
  postalCode: {
    type: String,
    trim: true,
    set: sanitizeString
  },
  useCase: {
    type: String,
    trim: true,
    set: sanitizeString
  },
  natureOfInquiry: {
    type: String,
    trim: true,
    set: sanitizeString
  },
  projectDescription: {
    type: String,
    trim: true,
    set: sanitizeString
  },
  interests: {
    type: String,
    enum: {
      values: VALID_INTERESTS,
      message: 'Invalid interest value.'
    },
    required: true,
    set: sanitizeString
  },
  marketingOptIn: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: {
      values: VALID_STATUSES,
      message: 'Invalid status value.'
    },
    default: 'new',
    set: sanitizeString
  },
  feedback: { type: String, set: sanitizeString },
  statusHistory: [statusHistorySchema],
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
  reference: {
    type: String,
    trim: true,
    default: '',
    set: sanitizeString
  },
  meetings: [meetingSchema],
  inquiryType: {
    type: String,
    required: [true, 'Inquiry type is required'],
    enum: {
      values: VALID_INQUIRY_TYPES,
      message: 'Invalid inquiry type.'
    },
    trim: true,
    set: sanitizeString
  },
  // Version number for inquiry changes
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
inquirySchema.pre('save', function(next) {
  if (!this.statusHistory) {
    this.statusHistory = [];
  }
  // If this is an update and status, meetings, or feedback have changed, increment version
  if (!this.isNew && (this.isModified('status') || this.isModified('meetings') || this.isModified('feedback'))) {
    this.version += 1;
    this.changeHistory.push({
      version: this.version,
      changes: 'Inquiry status, meetings, or feedback updated',
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
inquirySchema.index({ email: 1 });
inquirySchema.index({ status: 1 });
inquirySchema.index({ createdAt: -1 });
inquirySchema.index({ version: 1 });
inquirySchema.index({ inquiryType: 1 });
inquirySchema.index({ interests: 1 });
inquirySchema.index({ createdBy: 1 });
inquirySchema.index({ updatedBy: 1 });

// Compound indexes for complex queries
inquirySchema.index({ status: 1, inquiryType: 1 });
inquirySchema.index({ status: 1, interests: 1 });

// Static method to find inquiries by email and version
inquirySchema.statics.findByEmailAndVersion = function(email, version = 1) {
  return this.findOne({ email, version });
};

// Static method to get latest version of an inquiry
inquirySchema.statics.findLatestByEmail = function(email) {
  return this.findOne({ email }).sort({ version: -1 });
};

// Instance method to create a new version
inquirySchema.methods.createNewVersion = function(changes, changedBy) {
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

const Inquiry = mongoose.model('Inquiry', inquirySchema);

module.exports = Inquiry;

// End of Inquiry.js
// Description: End of inquiry model file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 