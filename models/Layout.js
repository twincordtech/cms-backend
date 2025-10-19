/* ========================================================================
 * File: Layout.js
 * Description: Mongoose schema for page layouts and layout components in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: Tech4biz Solutions Private
 * ======================================================================== */
const mongoose = require('mongoose');

// Valid component types for layout components (expand as needed)
const VALID_COMPONENT_TYPES = [
  'header', 'footer', 'sidebar', 'section', 'widget', 'custom', 'main', 'banner', 'about', 'testimonials', 'team', 'services', 'gallery', 'pricing', 'tabs', 'carousel', 'features', 'faq', 'stats', 'contactform', 'timeline', 'ctasection', 'comparison', 'herosection', 'navigation', 'megamenu', 'socialproof', 'producttour', 'appdownload', 'authentication', 'dashboard', 'footer', 'modal', 'errorpage', 'searchbar', 'form', 'content', 'media', 'cta', 'feature', 'blog', 'contact', 'newsletter', 'other',
  // Custom component types
  'TripleListImageCard', 'Productsbanner', 'Faqlist'
];

// Copy sanitizeFieldName from ComponentType.js for consistency
const sanitizeFieldName = (name) => {
  if (!name || typeof name !== 'string') return null;
  return name.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
};

// Sanitize string input to prevent injection attacks
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
};

// Schema for layout components
const layoutComponentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    validate: {
      validator: async function(value) {
        if (!value || typeof value !== 'string') return false;
        
        // Check if the value is in the valid component types array (case-sensitive)
        if (VALID_COMPONENT_TYPES.includes(value)) {
          return true;
        }
        
        // Check if it's a custom component type in the database (case-insensitive)
        try {
          const ComponentType = mongoose.model('ComponentType');
          const exists = await ComponentType.findOne({ 
            name: { $regex: new RegExp(`^${value}$`, 'i') }, 
            isActive: true 
          });
          if (exists) {
            return true;
          }
          
          // Also check Component collection for custom components
          const Component = mongoose.model('Component');
          const customExists = await Component.findOne({ 
            name: { $regex: new RegExp(`^${value}$`, 'i') }, 
            isActive: true 
          });
          if (customExists) {
            return true;
          }
          
          // If not found in database, allow it if it's a valid string format
          // This allows for custom components that might not be in the database yet
          const isValidFormat = /^[a-zA-Z][a-zA-Z0-9_]*$/.test(value);
          if (isValidFormat) {
            return true;
          }
          
          return false;
        } catch (err) {
          console.error('Error validating component type:', err);
          // If there's an error checking the database, allow the component type
          // This prevents validation failures due to database connection issues
          return true;
        }
      },
      message: 'Invalid component type.'
    }
  },
  name: {
    type: String,
    required: true,
    set: sanitizeString
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  order: {
    type: Number,
    default: 0
  }
});

// Main layout schema
const layoutSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a layout name'],
    unique: true,
    trim: true,
    set: sanitizeString,
    validate: {
      validator: function(name) {
        return name && name.length > 0 && name.length <= 100;
      },
      message: 'Layout name must be 1-100 characters.'
    }
  },
  page: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Page',
    required: [true, 'Please select a page']
  },
  components: [layoutComponentSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  versionKey: false // Disable Mongoose's internal versioning
});



// Pre-validate middleware to handle custom component types
layoutSchema.pre('validate', function(next) {
  // If components exist, ensure they have valid types
  if (this.components && Array.isArray(this.components)) {
    this.components.forEach((component, index) => {
      if (component.type && !VALID_COMPONENT_TYPES.includes(component.type)) {
        // Custom component types will be validated by the async validator
      }
    });
  }
  next();
});

// Database indexes for optimized query performance
layoutSchema.index({ name: 1 }, { unique: true });
layoutSchema.index({ page: 1 });
layoutSchema.index({ isActive: 1 });
layoutSchema.index({ createdBy: 1 });
layoutSchema.index({ updatedBy: 1 });
layoutSchema.index({ createdAt: -1 });

// Compound indexes for complex queries
layoutSchema.index({ page: 1, isActive: 1 });

// Static method to find layouts by name
layoutSchema.statics.findByName = function(name) {
  return this.findOne({ name });
};

const Layout = mongoose.model('Layout', layoutSchema);

module.exports = Layout;

/* ========================================================================
 * End of Layout.js
 * Description: End of layout model file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private.
 * ======================================================================== */ 