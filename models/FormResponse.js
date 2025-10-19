/*
 * File: FormResponse.js
 * Description: Mongoose schema for storing form submissions and responses in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const mongoose = require('mongoose');

// Valid response statuses
const VALID_RESPONSE_STATUSES = [
  'submitted', 'pending', 'approved', 'rejected', 'archived'
];

// Valid response data types for validation
const VALID_DATA_TYPES = [
  'string', 'number', 'boolean', 'date', 'array', 'object', 'file'
];

// Sanitize field names to prevent injection attacks
const sanitizeFieldName = (name) => {
  if (!name || typeof name !== 'string') return null;
  // Remove special characters and ensure alphanumeric with underscores only
  return name.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
};

// Sanitize response data to prevent XSS attacks
const sanitizeResponseData = (data) => {
  if (typeof data === 'string') {
    // Remove potentially dangerous HTML/script tags
    return data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
               .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
               .replace(/javascript:/gi, '')
               .replace(/on\w+\s*=/gi, '');
  }
  return data;
};

// Schema for individual field responses with validation
const fieldResponseSchema = new mongoose.Schema({
  // Name of the field that was responded to
  fieldName: {
    type: String,
    required: true,
    validate: {
      validator: function(name) {
        const sanitized = sanitizeFieldName(name);
        return sanitized && sanitized.length > 0 && sanitized.length <= 50;
      },
      message: 'Field name must be alphanumeric with underscores only, max 50 characters'
    },
    set: sanitizeFieldName // Automatically sanitize field names
  },
  // Type of the field for validation purposes
  fieldType: {
    type: String,
    required: true,
    enum: {
      values: VALID_DATA_TYPES,
      message: 'Invalid field type. Must be one of: ' + VALID_DATA_TYPES.join(', ')
    }
  },
  // The actual response value (sanitized)
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    set: sanitizeResponseData // Automatically sanitize response data
  },
  // Original value before sanitization (for audit purposes)
  originalValue: {
    type: mongoose.Schema.Types.Mixed,
    set: function(val) {
      // Store original value before sanitization
      this.value = sanitizeResponseData(val);
      return val;
    }
  },
  // Validation status for this field
  isValid: {
    type: Boolean,
    default: true
  },
  // Validation errors for this field
  validationErrors: [{
    type: String,
    maxlength: [200, 'Validation error message cannot exceed 200 characters']
  }],
  // Timestamp when this field was responded to
  respondedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  _id: false // Disable _id for subdocuments to reduce overhead
});

// Schema for file uploads in form responses
const fileUploadSchema = new mongoose.Schema({
  // Original filename
  originalName: {
    type: String,
    required: true,
    trim: true,
    maxlength: [255, 'Filename cannot exceed 255 characters']
  },
  // Stored filename on server
  filename: {
    type: String,
    required: true,
    trim: true
  },
  // File path on server
  filePath: {
    type: String,
    required: true
  },
  // File size in bytes
  size: {
    type: Number,
    required: true,
    min: [0, 'File size cannot be negative']
  },
  // MIME type of the file
  mimeType: {
    type: String,
    required: true,
    trim: true
  },
  // Upload timestamp
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  _id: false 
});

// Main schema for form responses
const formResponseSchema = new mongoose.Schema({
  // Reference to the form that was submitted
  form: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    required: true,
    index: true // Index for efficient form lookups
  },
  // Version number for response tracking
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  // Status of the form response
  status: {
    type: String,
    enum: {
      values: VALID_RESPONSE_STATUSES,
      message: 'Invalid status. Must be one of: ' + VALID_RESPONSE_STATUSES.join(', ')
    },
    default: 'submitted',
    index: true // Index for status-based queries
  },
  // Array of field responses
  responses: [{
    type: mongoose.Schema.Types.Mixed,
    required: true,
    // Enhanced custom validation for response structure
    validate: {
      validator: function(response) {
        // Validate field name
        if (!response.fieldName || !sanitizeFieldName(response.fieldName)) {
          return false;
        }
        
        // Validate field type
        if (!response.fieldType || !VALID_DATA_TYPES.includes(response.fieldType)) {
          return false;
        }
        
        // Validate value is present
        if (response.value === undefined || response.value === null) {
          return false;
        }
        
        // Validate value type matches field type
        if (response.fieldType === 'string' && typeof response.value !== 'string') {
          return false;
        }
        
        if (response.fieldType === 'number' && typeof response.value !== 'number') {
          return false;
        }
        
        if (response.fieldType === 'boolean' && typeof response.value !== 'boolean') {
          return false;
        }
        
        if (response.fieldType === 'date' && !(response.value instanceof Date)) {
          return false;
        }
        
        if (response.fieldType === 'array' && !Array.isArray(response.value)) {
          return false;
        }
        
        if (response.fieldType === 'object' && (typeof response.value !== 'object' || Array.isArray(response.value))) {
          return false;
        }
        
        return true;
      },
      message: 'Invalid response structure. Check field name, type, and value.'
    }
  }],
  // File uploads associated with this response
  fileUploads: [fileUploadSchema],
  // IP address of the submitter (for security tracking)
  ipAddress: {
    type: String,
    trim: true,
    validate: {
      validator: function(ip) {
        // Basic IP address validation
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return !ip || ipRegex.test(ip);
      },
      message: 'Invalid IP address format'
    }
  },
  // User agent string (for security tracking)
  userAgent: {
    type: String,
    trim: true,
    maxlength: [500, 'User agent string cannot exceed 500 characters']
  },
  // Referrer URL (for tracking)
  referrer: {
    type: String,
    trim: true,
    maxlength: [500, 'Referrer URL cannot exceed 500 characters']
  },
  // Submission timestamp
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true // Index for date-based queries
  },
  // Processing timestamp (when status was last updated)
  processedAt: {
    type: Date
  },
  // User who processed this response (if applicable)
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Notes or comments about this response
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  // Whether this response has been read by an admin
  isRead: {
    type: Boolean,
    default: false,
    index: true // Index for unread responses queries
  },
  // Tags for categorizing responses
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  // Change history for versioning
  changeHistory: [{
    version: { type: Number, required: true },
    changes: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true // Automatically add createdAt and updatedAt fields
});

// Pre-save middleware to handle versioning and validation
formResponseSchema.pre('save', function(next) {
  // If this is an update and responses have changed, increment version
  if (!this.isNew && this.isModified('responses')) {
    this.version += 1;
    
    // Add to change history
    this.changeHistory.push({
      version: this.version,
      changes: 'Response data updated',
      changedAt: new Date()
    });
  }
  
  // Update processedAt when status changes
  if (this.isModified('status') && this.status !== 'submitted') {
    this.processedAt = new Date();
  }
  
  // Limit change history to last 10 versions
  if (this.changeHistory.length > 10) {
    this.changeHistory = this.changeHistory.slice(-10);
  }
  
  next();
});

// Database indexes for optimized query performance
formResponseSchema.index({ form: 1 }); // Index for form lookups
formResponseSchema.index({ status: 1 }); // Index for status queries
formResponseSchema.index({ submittedAt: -1 }); // Index for submission date queries
formResponseSchema.index({ isRead: 1 }); // Index for read/unread queries
formResponseSchema.index({ version: 1 }); // Index for version queries
formResponseSchema.index({ tags: 1 }); // Index for tag-based queries
formResponseSchema.index({ processedBy: 1 }); // Index for processor queries

// Compound indexes for complex queries
formResponseSchema.index({ form: 1, status: 1 }); // Form responses by status
formResponseSchema.index({ form: 1, submittedAt: -1 }); // Form responses by date
formResponseSchema.index({ status: 1, isRead: 1 }); // Unread responses by status
formResponseSchema.index({ form: 1, version: 1 }); // Form response by version
formResponseSchema.index({ submittedAt: -1, status: 1 }); // Recent responses by status

// Text index for search functionality
formResponseSchema.index({
  'responses.value': 'text',
  notes: 'text',
  tags: 'text'
});

// Virtual field for response count
formResponseSchema.virtual('responseCount').get(function() {
  return this.responses ? this.responses.length : 0;
});

// Virtual field for file upload count
formResponseSchema.virtual('fileCount').get(function() {
  return this.fileUploads ? this.fileUploads.length : 0;
});

// Virtual field for total file size
formResponseSchema.virtual('totalFileSize').get(function() {
  if (!this.fileUploads) return 0;
  return this.fileUploads.reduce((total, file) => total + (file.size || 0), 0);
});

// Virtual field for processing time
formResponseSchema.virtual('processingTime').get(function() {
  if (!this.processedAt || !this.submittedAt) return null;
  return this.processedAt.getTime() - this.submittedAt.getTime();
});

// Ensure virtual fields are included when converting to JSON
formResponseSchema.set('toJSON', { virtuals: true });
formResponseSchema.set('toObject', { virtuals: true });

// Static method to find responses by form and version
formResponseSchema.statics.findByFormAndVersion = function(formId, version = 1) {
  return this.find({ form: formId, version });
};

// Static method to get latest version of responses for a form
formResponseSchema.statics.findLatestByForm = function(formId) {
  return this.find({ form: formId }).sort({ version: -1 });
};

// Static method to find unread responses
formResponseSchema.statics.findUnread = function() {
  return this.find({ isRead: false });
};

// Static method to find responses by status
formResponseSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

// Static method to get response statistics
formResponseSchema.statics.getStatistics = function(formId = null) {
  const match = formId ? { form: formId } : {};
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalSize: { $sum: { $size: '$fileUploads' } }
      }
    }
  ]);
};

// Instance method to create a new version
formResponseSchema.methods.createNewVersion = function(changes, changedBy) {
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

// Instance method to get response by field name
formResponseSchema.methods.getResponseByField = function(fieldName) {
  return this.responses.find(response => response.fieldName === fieldName);
};

// Instance method to mark as read
formResponseSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// Instance method to update status
formResponseSchema.methods.updateStatus = function(status, processedBy = null, notes = null) {
  this.status = status;
  this.processedAt = new Date();
  if (processedBy) this.processedBy = processedBy;
  if (notes) this.notes = notes;
  return this.save();
};

// Instance method to validate all responses
formResponseSchema.methods.validateResponses = function() {
  const errors = {};
  
  this.responses.forEach(response => {
    const fieldErrors = [];
    
    // Validate required fields (assuming all fields are required for now)
    if (response.value === undefined || response.value === null || response.value === '') {
      fieldErrors.push('Field is required');
    }
    
    // Validate value type matches field type
    if (response.fieldType === 'email' && typeof response.value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(response.value)) {
        fieldErrors.push('Invalid email format');
      }
    }
    
    if (response.fieldType === 'url' && typeof response.value === 'string') {
      const urlRegex = /^https?:\/\/.+/;
      if (!urlRegex.test(response.value)) {
        fieldErrors.push('Invalid URL format');
      }
    }
    
    if (response.fieldType === 'number' && isNaN(Number(response.value))) {
      fieldErrors.push('Must be a valid number');
    }
    
    if (fieldErrors.length > 0) {
      errors[response.fieldName] = fieldErrors;
      response.isValid = false;
      response.validationErrors = fieldErrors;
    } else {
      response.isValid = true;
      response.validationErrors = [];
    }
  });
  
  return errors;
};

const FormResponse = mongoose.model('FormResponse', formResponseSchema);

module.exports = FormResponse;

// End of FormResponse.js
// Description: End of form response model file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 