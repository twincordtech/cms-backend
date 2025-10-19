/*
 * File: Component.js
 * Description: Mongoose schema for dynamic components and form fields in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const mongoose = require('mongoose');

// Valid field types for component fields
const VALID_FIELD_TYPES = [
  'text', 'textarea', 'richText', 'number', 'image',
  'boolean', 'date', 'select', 'array', 'object'
];

// Sanitize string input to prevent injection attacks
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
};

// Recursive schema for nested fields to support complex form structures
const createFieldSchema = () => {
  const schema = new mongoose.Schema({
    // Name of the field (used for form submission and data access)
    name: {
      type: String,
      required: [true, 'Please provide a field name'],
      set: sanitizeString,
      validate: {
        validator: function(name) {
          return name && name.length > 0 && name.length <= 50;
        },
        message: 'Field name must be 1-50 characters.'
      }
    },
    // Type of field (text, textarea, select, etc.)
    type: {
      type: String,
      required: [true, 'Please provide a field type'],
      enum: {
        values: VALID_FIELD_TYPES,
        message: 'Invalid field type.'
      }
    },
    // Human-readable label for the field
    label: { type: String, set: sanitizeString },
    // Description or help text for the field
    description: { type: String, set: sanitizeString },
    // Whether the field is required for form submission
    required: {
      type: Boolean,
      default: false
    },
    // Default value for the field
    defaultValue: mongoose.Schema.Types.Mixed,
    // Options for select fields
    options: [{
      label: { type: String, set: sanitizeString },
      value: { type: String, set: sanitizeString }
    }],
    // Validation constraints
    min: mongoose.Schema.Types.Mixed, // Minimum value/length
    max: mongoose.Schema.Types.Mixed, // Maximum value/length
    pattern: { type: String, set: sanitizeString }, // Regex pattern for validation
    // Rich text editor configuration
    allowedTags: [{ type: String, set: sanitizeString }], // HTML tags allowed in rich text
    // Image field configuration
    allowedTypes: [{ type: String, set: sanitizeString }], // Allowed file types
    maxSize: Number, // Maximum file size in bytes
    // Number field configuration
    step: Number, // Step increment for number inputs
    // Date field configuration
    minDate: Date, // Minimum allowed date
    maxDate: Date  // Maximum allowed date
  }, { _id: false }); // Disable _id for subdocuments to reduce overhead

  // Add subFields for array and object types (recursive structure)
  schema.add({
    subFields: [schema] // This creates the recursive structure for nested fields
  });

  return schema;
};

// Create the field schema instance
const fieldSchema = createFieldSchema();

// Main component schema for dynamic form components
const componentSchema = new mongoose.Schema(
  {
    // Unique name for the component
    name: {
      type: String,
      required: [true, 'Please provide a component name'],
      unique: true,
      trim: true,
      set: sanitizeString,
      validate: {
        validator: function(name) {
          return name && name.length > 0 && name.length <= 100;
        },
        message: 'Component name must be 1-100 characters.'
      }
    },
    // Type of component (text, textarea, etc.)
    fieldType: {
      type: String,
      required: [true, 'Please provide a field type'],
      enum: {
        values: VALID_FIELD_TYPES,
        message: 'Invalid field type.'
      }
    },
    // Array of field definitions for the component
    fields: [fieldSchema],
    // Reference to the page this component belongs to
    page: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Page',
      default: null
    },
    // Order of the component on the page
    order: {
      type: Number,
      default: 0
    },
    // Whether the component is active/visible
    isActive: {
      type: Boolean,
      default: true
    },
    // User who created the component
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // User who last updated the component
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    // Reference to another component this is based on (for inheritance)
    isBasedOn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Component'
    },
    // Version number for component changes
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
  },
  {
    timestamps: true // Automatically add createdAt and updatedAt fields
  }
);

// Pre-save middleware to automatically set updatedBy field and handle versioning
componentSchema.pre('save', function(next) {
  if (this.isNew) {
    // For new components, set updatedBy to the same as createdBy
    this.updatedBy = this.createdBy;
  }
  // If this is an update and fields or isActive have changed, increment version
  if (!this.isNew && (this.isModified('fields') || this.isModified('isActive'))) {
    this.version += 1;
    this.changeHistory.push({
      version: this.version,
      changes: 'Component fields or status updated',
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
componentSchema.index({ page: 1, order: 1 }); // Index for page-based ordering
componentSchema.index({ name: 1 }, { unique: true }); // Unique index for component names
componentSchema.index({ createdAt: -1 }); // Index for creation date queries
componentSchema.index({ isBasedOn: 1 }); // Index for component inheritance queries
componentSchema.index({ version: 1 }); // Index for version queries
componentSchema.index({ isActive: 1 }); // Index for active components
componentSchema.index({ createdBy: 1 }); // Index for creator queries
componentSchema.index({ updatedBy: 1 }); // Index for updater queries

// Compound indexes for complex queries
componentSchema.index({ page: 1, isActive: 1 });
componentSchema.index({ name: 1, version: 1 });

// Static method to find components by name and version
componentSchema.statics.findByNameAndVersion = function(name, version = 1) {
  return this.findOne({ name, version });
};

// Static method to get latest version of a component
componentSchema.statics.findLatestByName = function(name) {
  return this.findOne({ name }).sort({ version: -1 });
};

// Instance method to create a new version
componentSchema.methods.createNewVersion = function(changes, changedBy) {
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

const Component = mongoose.model('Component', componentSchema);

module.exports = Component;

// End of Component.js
// Description: End of component model file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 