/*
 * File: Form.js
 * Description: Mongoose schema for form definitions and configurations in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const mongoose = require('mongoose');

// Valid field types for form definitions
const VALID_FIELD_TYPES = [
  'text', 'textarea', 'email', 'number', 'tel', 'url', 
  'date', 'datetime-local', 'time', 'select', 'radio', 
  'checkbox', 'file', 'hidden', 'password', 'range', 
  'color', 'search', 'url', 'week', 'month'
];

// Valid validation types for form fields
const VALID_VALIDATION_TYPES = [
  'required', 'email', 'url', 'min', 'max', 'minLength', 
  'maxLength', 'pattern', 'custom', 'fileSize', 'fileType'
];

// Sanitize field names to prevent injection attacks
const sanitizeFieldName = (name) => {
  if (!name || typeof name !== 'string') return null;
  // Remove special characters and ensure alphanumeric with underscores only
  return name.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
};

// Sanitize form names to prevent injection attacks
const sanitizeFormName = (name) => {
  if (!name || typeof name !== 'string') return null;
  // Remove special characters and ensure alphanumeric with spaces and hyphens only
  return name.replace(/[^a-zA-Z0-9\s\-]/g, '').trim();
};

// Schema for form field validation rules
const validationRuleSchema = new mongoose.Schema({
  // Type of validation (required, email, min, max, etc.)
  type: {
    type: String,
    required: true,
    enum: {
      values: VALID_VALIDATION_TYPES,
      message: 'Invalid validation type. Must be one of: ' + VALID_VALIDATION_TYPES.join(', ')
    }
  },
  // Value for the validation rule (e.g., min value, pattern, etc.)
  value: mongoose.Schema.Types.Mixed,
  // Custom error message for this validation rule
  message: {
    type: String,
    maxlength: [200, 'Validation message cannot exceed 200 characters']
  }
}, { 
  _id: false // Disable _id for subdocuments to reduce overhead
});

// Schema for form field options (for select, radio, checkbox fields)
const fieldOptionSchema = new mongoose.Schema({
  // Display label for the option
  label: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Option label cannot exceed 100 characters']
  },
  // Value for the option
  value: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Option value cannot exceed 100 characters']
  },
  // Whether this option is selected by default
  selected: {
    type: Boolean,
    default: false
  }
}, { 
  _id: false 
});

// Schema for individual form fields
const formFieldSchema = new mongoose.Schema({
  // Unique identifier for the field within the form
  name: {
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
  // Type of form field with strict validation
  type: {
    type: String,
    required: true,
    enum: {
      values: VALID_FIELD_TYPES,
      message: 'Invalid field type. Must be one of: ' + VALID_FIELD_TYPES.join(', ')
    }
  },
  // Display label for the field
  label: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Field label cannot exceed 100 characters']
  },
  // Placeholder text for the field
  placeholder: {
    type: String,
    trim: true,
    maxlength: [200, 'Placeholder text cannot exceed 200 characters']
  },
  // Default value for the field
  defaultValue: mongoose.Schema.Types.Mixed,
  // Whether the field is required
  required: {
    type: Boolean,
    default: false
  },
  // Validation rules for the field
  validation: [validationRuleSchema],
  // Options for select, radio, checkbox fields
  options: [fieldOptionSchema],
  // Additional field properties (style, attributes, etc.)
  properties: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  // Order of the field within the form
  order: {
    type: Number,
    default: 0,
    min: 0
  },
  // Whether the field is visible
  visible: {
    type: Boolean,
    default: true
  }
}, { 
  _id: false // Disable _id for subdocuments to reduce overhead
});

// Main schema for form definitions
const formSchema = new mongoose.Schema({
  // Unique name for the form
  name: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(name) {
        const sanitized = sanitizeFormName(name);
        return sanitized && sanitized.length > 0 && sanitized.length <= 100;
      },
      message: 'Form name must be alphanumeric with spaces and hyphens only, max 100 characters'
    },
    set: sanitizeFormName // Automatically sanitize form names
  },
  // Version number for form changes
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  // Title of the form
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Form title cannot exceed 200 characters']
  },
  // Description of the form
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Form description cannot exceed 500 characters']
  },
  // Array of form fields
  fields: [{
    type: mongoose.Schema.Types.Mixed,
    required: true,
    // Enhanced custom validation for field structure
    validate: {
      validator: function(field) {
        // Validate field name
        if (!field.name || !sanitizeFieldName(field.name)) {
          return false;
        }
        
        // Validate field type
        if (!field.type || !VALID_FIELD_TYPES.includes(field.type)) {
          return false;
        }
        
        // Validate field label
        if (!field.label || field.label.trim().length === 0) {
          return false;
        }
        
        // For select, radio, checkbox fields, ensure options are provided
        if (['select', 'radio', 'checkbox'].includes(field.type)) {
          if (!field.options || !Array.isArray(field.options) || field.options.length === 0) {
            return false;
          }
          // Validate each option
          return field.options.every(option => 
            option.label && option.label.trim().length > 0 &&
            option.value && option.value.trim().length > 0
          );
        }
        
        // Validate validation rules if provided
        if (field.validation && Array.isArray(field.validation)) {
          return field.validation.every(rule => 
            rule.type && VALID_VALIDATION_TYPES.includes(rule.type)
          );
        }
        
        return true;
      },
      message: 'Invalid field structure. Check field name, type, label, and required properties.'
    }
  }],
  // Form submission settings
  settings: {
    // Whether to enable form submission
    enabled: {
      type: Boolean,
      default: true
    },
    // Maximum number of submissions allowed
    maxSubmissions: {
      type: Number,
      min: 0,
      default: 0 // 0 means unlimited
    },
    // Whether to send email notifications on submission
    emailNotifications: {
      type: Boolean,
      default: false
    },
    // Email addresses to notify
    notifyEmails: [{
      type: String,
      validate: {
        validator: function(email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        },
        message: 'Invalid email address format'
      }
    }],
    // Success message to display after submission
    successMessage: {
      type: String,
      default: 'Thank you! Your form has been submitted successfully.',
      maxlength: [500, 'Success message cannot exceed 500 characters']
    },
    // Redirect URL after successful submission
    redirectUrl: {
      type: String,
      maxlength: [500, 'Redirect URL cannot exceed 500 characters']
    }
  },
  // Form styling and appearance
  styling: {
    // CSS classes for the form
    cssClasses: [String],
    // Custom CSS styles
    customStyles: String,
    // Theme for the form
    theme: {
      type: String,
      enum: ['default', 'modern', 'minimal', 'bootstrap', 'custom'],
      default: 'default'
    }
  },
  // Whether the form is active and available for use
  isActive: {
    type: Boolean,
    default: true
  },
  // Tags for categorizing forms
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

// Pre-save middleware to handle versioning
formSchema.pre('save', function(next) {
  // If this is an update and fields have changed, increment version
  if (!this.isNew && this.isModified('fields')) {
    this.version += 1;
    
    // Add to change history
    this.changeHistory.push({
      version: this.version,
      changes: 'Form fields updated',
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
formSchema.index({ name: 1 }, { unique: true }); // Unique index for form names
formSchema.index({ isActive: 1 }); // Index for active forms
formSchema.index({ version: 1 }); // Index for version queries
formSchema.index({ tags: 1 }); // Index for tag-based queries
formSchema.index({ createdAt: -1 }); // Index for creation date queries
formSchema.index({ 'fields.name': 1 }); // Index for field name queries
formSchema.index({ 'settings.enabled': 1 }); // Index for enabled forms

// Compound indexes for complex queries
formSchema.index({ isActive: 1, tags: 1 }); // Active forms by tags
formSchema.index({ name: 1, version: 1 }); // Form by version
formSchema.index({ isActive: 1, 'settings.enabled': 1 }); // Active and enabled forms

// Virtual field for field count
formSchema.virtual('fieldCount').get(function() {
  return this.fields ? this.fields.length : 0;
});

// Virtual field for visible field count
formSchema.virtual('visibleFieldCount').get(function() {
  return this.fields ? this.fields.filter(field => field.visible !== false).length : 0;
});

// Ensure virtual fields are included when converting to JSON
formSchema.set('toJSON', { virtuals: true });
formSchema.set('toObject', { virtuals: true });

// Static method to find form by name and version
formSchema.statics.findByNameAndVersion = function(name, version = 1) {
  return this.findOne({ name, version });
};

// Static method to get latest version of a form
formSchema.statics.findLatestByName = function(name) {
  return this.findOne({ name }).sort({ version: -1 });
};

// Static method to find active forms
formSchema.statics.findActive = function() {
  return this.find({ isActive: true, 'settings.enabled': true });
};

// Instance method to create a new version
formSchema.methods.createNewVersion = function(changes, changedBy) {
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

// Instance method to get field by name
formSchema.methods.getFieldByName = function(fieldName) {
  return this.fields.find(field => field.name === fieldName);
};

// Instance method to validate form data against field definitions
formSchema.methods.validateFormData = function(data) {
  const errors = {};
  
  this.fields.forEach(field => {
    const value = data[field.name];
    
    // Check required fields
    if (field.required && (value === undefined || value === null || value === '')) {
      errors[field.name] = `${field.label} is required`;
      return;
    }
    
    // Skip validation if field is empty and not required
    if (value === undefined || value === null || value === '') {
      return;
    }
    
    // Validate based on field type
    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors[field.name] = 'Invalid email format';
    }
    
    if (field.type === 'url' && !/^https?:\/\/.+/.test(value)) {
      errors[field.name] = 'Invalid URL format';
    }
    
    if (field.type === 'number' && isNaN(Number(value))) {
      errors[field.name] = 'Must be a valid number';
    }
    
    // Apply custom validation rules
    if (field.validation) {
      field.validation.forEach(rule => {
        if (rule.type === 'minLength' && value.length < rule.value) {
          errors[field.name] = rule.message || `Minimum length is ${rule.value} characters`;
        }
        
        if (rule.type === 'maxLength' && value.length > rule.value) {
          errors[field.name] = rule.message || `Maximum length is ${rule.value} characters`;
        }
        
        if (rule.type === 'pattern' && !new RegExp(rule.value).test(value)) {
          errors[field.name] = rule.message || 'Invalid format';
        }
      });
    }
  });
  
  return errors;
};

const Form = mongoose.model('Form', formSchema);

module.exports = Form;

// End of Form.js
// Description: End of form model file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 