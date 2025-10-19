/*
 * File: layouts.js
 * Description: Express routes for layout management in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const express = require('express');
const router = express.Router();
const { protect, authorizeAdmin } = require('../middleware/authMiddleware');
const Layout = require('../models/Layout');
const Page = require('../models/Page');
const Component = require('../models/Component');
const ComponentType = require('../models/ComponentType');
const asyncHandler = require('../middleware/async');

// Utility to sanitize string input
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.]/g, '').trim();
};

// Helper function to transform fields recursively
const transformFields = (fields) => {
  console.log('TransformFields input:', fields);
  
  const transformed = fields.map(field => {
    console.log('Processing field:', field.name, 'type:', field.type, 'options:', field.options);
    
    // Convert options from string array to object array if needed
    let processedOptions = field.options;
    if (field.options && Array.isArray(field.options) && field.options.length > 0) {
      if (typeof field.options[0] === 'string') {
        // Convert string array to object array
        processedOptions = field.options.map(option => ({
          label: option,
          value: option
        }));
        console.log('Converted options from strings to objects:', processedOptions);
      }
    }
    
    if (field.type === 'array' && field.subFields) {
      const result = {
        name: field.name,
        type: field.type,
        fieldType: field.fieldType || field.type,
        description: field.description,
        required: field.required,
        options: processedOptions, // Use processed options
        default: field.default,
        min: field.min,
        max: field.max,
        step: field.step,
        itemStructure: transformFields(field.subFields) // Recursively transform subfields
      };
      console.log('Transformed array field:', field.name, 'result:', result);
      return result;
    }
    
    const result = {
      name: field.name,
      type: field.type,
      fieldType: field.fieldType || field.type,
      description: field.description,
      required: field.required,
      options: processedOptions, // Use processed options
      default: field.default,
      min: field.min,
      max: field.max,
      step: field.step
    };
    
    console.log('Transformed field:', field.name, 'result:', result);
    return result;
  });
  
  console.log('TransformFields output:', transformed);
  return transformed;
};

// Helper function to get component fields with complete structure
const getComponentFields = async (componentType) => {
  try {
    // Normalize component type to lowercase for consistent matching
    const normalizedType = componentType.toLowerCase();
    
    console.log(`Getting component fields for: ${componentType} (normalized: ${normalizedType})`);
    
    // Try to get from Component collection first (case-insensitive)
    const customComponent = await Component.findOne({ 
      name: { $regex: new RegExp(`^${componentType}$`, 'i') }
    });
    if (customComponent) {
      console.log('Found custom component:', customComponent.name);
      const transformed = transformFields(customComponent.fields);
      console.log('Transformed fields:', transformed.map(f => ({ name: f.name, type: f.type, options: f.options })));
      return transformed;
    }

    // If not found in Component, try ComponentType (case-insensitive)
    const seededComponent = await ComponentType.findOne({ 
      name: { $regex: new RegExp(`^${componentType}$`, 'i') }
    });
    if (seededComponent) {
      console.log('Found seeded component:', seededComponent.name);
      const transformed = transformFields(seededComponent.fields);
      console.log('Transformed fields:', transformed.map(f => ({ name: f.name, type: f.type, options: f.options })));
      return transformed;
    }

    // If still not found, try with normalized lowercase name
    const normalizedComponent = await ComponentType.findOne({ name: normalizedType });
    if (normalizedComponent) {
      console.log('Found normalized component:', normalizedComponent.name);
      const transformed = transformFields(normalizedComponent.fields);
      console.log('Transformed fields:', transformed.map(f => ({ name: f.name, type: f.type, options: f.options })));
      return transformed;
    }

    console.warn(`Component type not found: ${componentType} (normalized: ${normalizedType})`);
    return [];
  } catch (error) {
    console.error('Error getting component fields:', error);
    return [];
  }
};

// Transform component data recursively
const transformComponentData = (data, fields) => {
  const transformed = {};
  fields.forEach(field => {
    if (field.type === 'array') {
      transformed[field.name] = {
        value: Array.isArray(data[field.name]?.value) ? data[field.name].value.map(item => {
          if (field.itemStructure) {
            // Transform each item in the array using the itemStructure
            const transformedItem = {};
            field.itemStructure.forEach(subField => {
              if (subField.type === 'array') {
                transformedItem[subField.name] = {
                  value: item[subField.name]?.value || [],
                  type: subField.type,
                  fieldType: subField.fieldType || subField.type,
                  itemStructure: subField.itemStructure
                };
              } else {
                transformedItem[subField.name] = {
                  value: item[subField.name]?.value || '',
                  type: subField.type,
                  fieldType: subField.fieldType || subField.type
                };
              }
            });
            return transformedItem;
          }
          return item;
        }) : [],
        type: field.type,
        fieldType: field.fieldType || field.type,
        itemStructure: field.itemStructure
      };
    } else {
      transformed[field.name] = {
        value: data[field.name]?.value || data[field.name] || field.default || '',
        type: field.type,
        fieldType: field.fieldType || field.type
      };
    }
  });
  return transformed;
};

// @desc    Get all layouts
// @route   GET /api/layouts
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const layouts = await Layout.find()
      .populate('page', 'title slug isMultiPage')
      .populate('createdBy', 'email');

    // Transform layouts to include field types and structure
    const transformedLayouts = await Promise.all(layouts.map(async (layout) => {
      const transformedComponents = await Promise.all(layout.components.map(async (component) => {
        // Get complete field structure for the component
        const fields = await getComponentFields(component.type);
        
        return {
          type: component.type,
          name: component.name,
          data: transformComponentData(component.data, fields),
          order: component.order,
          _id: component._id,
          fields: fields
        };
      }));

      return {
        ...layout.toObject(),
        components: transformedComponents
      };
    }));

    res.json({
      success: true,
      statusCode: 6000,
      data: transformedLayouts
    });
  } catch (error) {
    console.error('Error fetching layouts:', error);
    res.status(500).json({
      success: false,
      statusCode: 5000,
      error: 'Failed to fetch layouts'
    });
  }
});

// @desc    Get single layout
// @route   GET /api/layouts/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const layout = await Layout.findById(req.params.id)
      .populate('page', 'title slug isMultiPage')
      .populate('createdBy', 'email');

    if (!layout) {
      return res.status(404).json({
        success: false,
        statusCode: 5001,
        error: 'Layout not found'
      });
    }

    // Transform components to include field types and structure
    const transformedComponents = await Promise.all(layout.components.map(async (component) => {
      // Get complete field structure for the component
      const fields = await getComponentFields(component.type);
      
      return {
        type: component.type,
        name: component.name,
        data: transformComponentData(component.data, fields),
        order: component.order,
        _id: component._id,
        fields: fields
      };
    }));

    const transformedLayout = {
      ...layout.toObject(),
      components: transformedComponents
    };

    res.json({
      success: true,
      statusCode: 6000,
      data: transformedLayout
    });
  } catch (error) {
    console.error('Error fetching layout:', error);
    res.status(500).json({
      success: false,
      statusCode: 5000,
      error: 'Failed to fetch layout'
    });
  }
});

// @desc    Create layout
// @route   POST /api/layouts
// @access  Private/Admin
router.post('/', protect, authorizeAdmin, async (req, res) => {
  try {
    const layout = await Layout.create({
      ...req.body,
      createdBy: req.user._id
    });

    await layout.populate('page', 'title slug');
    await layout.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: layout
    });
  } catch (error) {
    console.error('Error creating layout:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update layout
// @route   PUT /api/layouts/:id
// @access  Private/Admin
router.put('/:id', protect, authorizeAdmin, async (req, res) => {
  try {
    const layout = await Layout.findById(req.params.id);
    if (!layout) {
      return res.status(404).json({
        success: false,
        message: 'Layout not found'
      });
    }
    
    // Use findByIdAndUpdate to bypass versioning issues
    const updatedLayout = await Layout.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body, 
        updatedBy: req.user._id 
      },
      { 
        new: true, 
        runValidators: true,
        // Disable versioning for this update
        versionKey: false
      }
    ).populate('page', 'title slug')
     .populate('createdBy', 'name email');
    
    res.json({
      success: true,
      data: updatedLayout
    });
  } catch (error) {
    console.error('Error updating layout:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});



// @desc    Delete layout
// @route   DELETE /api/layouts/:id
// @access  Private/Admin
router.delete('/:id', protect, authorizeAdmin, async (req, res) => {
  try {
    const layout = await Layout.findById(req.params.id);

    if (!layout) {
      return res.status(404).json({
        success: false,
        message: 'Layout not found'
      });
    }

    await layout.deleteOne();

    res.json({
      success: true,
      message: 'Layout deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting layout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete layout'
    });
  }
});

// @desc    Get components for a page
// @route   GET /api/layouts/page/:pageId/components
// @access  Private/Admin
router.get('/page/:pageId/components', protect, authorizeAdmin, asyncHandler(async (req, res) => {
  const components = await Component.find({ page: req.params.pageId })
    .select('name type config');
  
  res.json({ data: components });
}));

module.exports = router;

// End of layouts.js
// Description: End of layouts routes file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 