/*
 * File: ComponentType.js
 * Description: Mongoose schema for defining component types and their field structures in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const mongoose = require('mongoose');

// Valid field types for component type definitions
const VALID_FIELD_TYPES = [
  'text', 'textarea', 'richText', 'number', 'image', 
  'boolean', 'date', 'select', 'array', 'object', 
  'email', 'url', 'phone', 'file', 'color', 'range'
];

// Valid field types for array item structures
const VALID_ARRAY_ITEM_TYPES = [
  'text', 'textarea', 'number', 'image', 'boolean', 
  'date', 'select', 'object', 'email', 'url', 'file'
];

// Sanitize field names to prevent injection attacks
const sanitizeFieldName = (name) => {
  if (!name || typeof name !== 'string') return null;
  // Remove special characters and ensure alphanumeric with underscores only
  return name.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
};

// Schema for individual field definitions within component types
const fieldSchema = new mongoose.Schema({
  // Name of the field (used for data access and form generation)
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
  // Type of field with strict validation
  type: {
    type: String,
    required: true,
    enum: {
      values: VALID_FIELD_TYPES,
      message: 'Invalid field type. Must be one of: ' + VALID_FIELD_TYPES.join(', ')
    }
  },
  // Default value for the field
  default: {
    type: mongoose.Schema.Types.Mixed,
    validate: {
      validator: function(value) {
        // Validate default value based on field type
        if (this.type === 'number' && typeof value !== 'number') {
          return false;
        }
        if (this.type === 'boolean' && typeof value !== 'boolean') {
          return false;
        }
        if (this.type === 'date' && !(value instanceof Date)) {
          return false;
        }
        return true;
      },
      message: 'Default value must match the field type'
    }
  },
  // Validation constraints for the field
  validation: {
    required: { type: Boolean, default: false },
    min: mongoose.Schema.Types.Mixed,
    max: mongoose.Schema.Types.Mixed,
    pattern: String,
    minLength: Number,
    maxLength: Number
  },
  // Options for select fields
  options: [{
    label: { type: String, required: true },
    value: { type: String, required: true }
  }]
}, { 
  _id: false // Disable _id for subdocuments to reduce overhead
});

// Schema for array item structure with validation
const itemStructureSchema = new mongoose.Schema({
  // Name of the array item field
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
    set: sanitizeFieldName
  },
  // Type of the array item field with strict validation
  type: {
    type: String,
    required: true,
    enum: {
      values: VALID_ARRAY_ITEM_TYPES,
      message: 'Invalid array item type. Must be one of: ' + VALID_ARRAY_ITEM_TYPES.join(', ')
    }
  },
  // Validation for array items
  validation: {
    required: { type: Boolean, default: false },
    min: mongoose.Schema.Types.Mixed,
    max: mongoose.Schema.Types.Mixed
  }
}, { 
  _id: false 
});

// Main schema for component types that define reusable component structures
const componentTypeSchema = new mongoose.Schema({
  // Unique name for the component type
  name: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(name) {
        const sanitized = sanitizeFieldName(name);
        return sanitized && sanitized.length > 0 && sanitized.length <= 100;
      },
      message: 'Component type name must be alphanumeric with underscores only, max 100 characters'
    },
    set: sanitizeFieldName
  },
  // Version number for component type changes
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  // Array of field definitions for this component type
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
        
        // For array fields, ensure itemStructure is provided and valid
        if (field.type === 'array') {
          if (!Array.isArray(field.itemStructure) || field.itemStructure.length === 0) {
            return false;
          }
          // Validate each item in the structure
          return field.itemStructure.every(item => 
            item.name && sanitizeFieldName(item.name) && 
            item.type && VALID_ARRAY_ITEM_TYPES.includes(item.type)
          );
        }
        
        // For select fields, ensure options are provided
        if (field.type === 'select' && (!field.options || !Array.isArray(field.options))) {
          return false;
        }
        
        return true;
      },
      message: 'Invalid field structure. Check field name, type, and required properties.'
    }
  }],
  // Whether this component type is active and available for use
  isActive: {
    type: Boolean,
    default: true
  },
  // Description of the component type
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  // Tags for categorizing component types
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
componentTypeSchema.pre('save', function(next) {
  // If this is an update and fields have changed, increment version
  if (!this.isNew && this.isModified('fields')) {
    this.version += 1;
    
    // Add to change history
    this.changeHistory.push({
      version: this.version,
      changes: 'Fields updated',
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
componentTypeSchema.index({ name: 1 }, { unique: true }); // Unique index for component type names
componentTypeSchema.index({ isActive: 1 }); // Index for active component types
componentTypeSchema.index({ version: 1 }); // Index for version queries
componentTypeSchema.index({ tags: 1 }); // Index for tag-based queries
componentTypeSchema.index({ createdAt: -1 }); // Index for creation date queries
componentTypeSchema.index({ 'fields.name': 1 }); // Index for field name queries

// Compound indexes for complex queries
componentTypeSchema.index({ isActive: 1, tags: 1 }); // Active components by tags
componentTypeSchema.index({ name: 1, version: 1 }); // Component type by version

// Virtual field for field count
componentTypeSchema.virtual('fieldCount').get(function() {
  return this.fields ? this.fields.length : 0;
});

// Ensure virtual fields are included when converting to JSON
componentTypeSchema.set('toJSON', { virtuals: true });
componentTypeSchema.set('toObject', { virtuals: true });

// Static method to find component type by name and version
componentTypeSchema.statics.findByNameAndVersion = function(name, version = 1) {
  return this.findOne({ name, version });
};

// Static method to get latest version of a component type
componentTypeSchema.statics.findLatestByName = function(name) {
  return this.findOne({ name }).sort({ version: -1 });
};

// Instance method to create a new version
componentTypeSchema.methods.createNewVersion = function(changes, changedBy) {
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

const ComponentType = mongoose.model('ComponentType', componentTypeSchema);

module.exports = ComponentType;

// End of ComponentType.js
// Description: End of component type model file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 