/*
 * File: components.js
 * Description: Express routes for advanced component CRUD and management in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const express = require('express');
const router = express.Router();
const { protect, authorizeAdmin } = require('../middleware/authMiddleware');
const Component = require('../models/Component');

// Utility to sanitize string input
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.]/g, '').trim();
};

// @desc    Get all components
// @route   GET /api/cms/components
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const components = await Component.find()
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ order: 1 });

    // Format components into the required structure
    const formattedComponents = components.reduce((acc, component) => {
      acc[component.name] = {
        fields: component.fields.map(field => {
          const formattedField = {
            name: field.name,
            type: field.type,
            label: field.label,
            description: field.description,
            required: field.required
          };

          if (field.defaultValue !== undefined) {
            formattedField.default = field.defaultValue;
          }

          if (field.type === 'select' && field.options) {
            formattedField.options = field.options;
          }

          if (field.type === 'array' && field.subFields) {
            formattedField.itemStructure = field.subFields.map(subField => ({
              name: subField.name,
              type: subField.type,
              label: subField.label
            }));
          }

          return formattedField;
        }),
        isPredefined: component.isPredefined || false,
        createdBy: component.createdBy
      };
      return acc;
    }, {});

    res.json({ success: true, data: formattedComponents });
  } catch (error) {
    console.error('Error fetching components:', error);
    res.status(500).json({ success: false, message: 'Error fetching components' });
  }
});

// @desc    Get single component
// @route   GET /api/cms/components/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const component = await Component.findById(req.params.id)
      .populate('page', 'name slug')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    if (!component) {
      return res.status(404).json({ success: false, message: 'Component not found' });
    }
    res.json({ success: true, data: component });
  } catch (error) {
    console.error('Error fetching component:', error);
    res.status(500).json({ success: false, message: 'Error fetching component' });
  }
});

// @desc    Create new component
// @route   POST /api/cms/components
// @access  Private/Admin
router.post('/', protect, authorizeAdmin, async (req, res) => {
  try {
    const { name, fields } = req.body;
    
    // Validate required fields
    if (!name || !fields || !Array.isArray(fields)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide component name and fields array' 
      });
    }

    // Check if component with same name exists
    const existingComponent = await Component.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingComponent) {
      return res.status(400).json({ 
        success: false, 
        message: `A component with the name "${name}" already exists. Please choose a different name.` 
      });
    }

    // Process and validate fields
    const processedFields = fields.map(field => {
      const processedField = {
        name: field.name,
        type: field.type,
        fieldType: field.fieldType || field.type, // Use fieldType if provided, fallback to type
        label: field.label || field.name,
        description: field.description || '',
        required: field.required || false
      };

      // Add default value if provided
      if (field.defaultValue !== undefined) {
        processedField.defaultValue = field.defaultValue;
      }

      // Handle select field options
      if (field.type === 'select' && Array.isArray(field.options)) {
        processedField.options = field.options.map(option => ({
          label: option.label || option.value,
          value: option.value
        }));
      }

      // Handle array field subFields
      if (field.type === 'array' && Array.isArray(field.subFields)) {
        processedField.subFields = field.subFields.map(subField => ({
          name: subField.name,
          type: subField.type,
          fieldType: subField.fieldType || subField.type, // Add fieldType for subfields
          label: subField.label || subField.name
        }));
      }

      return processedField;
    });

    // Create the component with processed fields
    const componentData = {
      name,
      fields: processedFields,
      createdBy: req.user._id,
      isPredefined: false
    };

    const component = await Component.create(componentData);

    // Populate the user fields
    const populatedComponent = await Component.findById(component._id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.status(201).json({ success: true, data: populatedComponent });
  } catch (error) {
    console.error('Error creating component:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: `A component with the name "${req.body.name}" already exists. Please choose a different name.` 
      });
    }
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Error creating component' 
    });
  }
});

// @desc    Update component
// @route   PUT /api/cms/components/:id
// @access  Private/Admin
router.put('/:id', protect, authorizeAdmin, async (req, res) => {
  try {
    const { name, fields, page, order, isActive } = req.body;
    
    // Validate required fields
    if (!name || !fields || !Array.isArray(fields)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide component name and fields array' 
      });
    }

    // Check if component exists
    let component = await Component.findById(req.params.id);
    if (!component) {
      return res.status(404).json({ success: false, message: 'Component not found' });
    }

    // Check if new name conflicts with existing component
    if (name !== component.name) {
      const existingComponent = await Component.findOne({ name });
      if (existingComponent) {
        return res.status(400).json({ 
          success: false, 
          message: 'Component with this name already exists' 
        });
      }
    }

    component = await Component.findByIdAndUpdate(
      req.params.id,
      {
        name,
        fields,
        page: page || null,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
        updatedBy: req.user._id
      },
      { new: true }
    )
    .populate('page', 'name slug')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

    res.json({ success: true, data: component });
  } catch (error) {
    console.error('Error updating component:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Error updating component' 
    });
  }
});

// @desc    Delete component
// @route   DELETE /api/cms/components/:id
// @access  Private/Admin
router.delete('/:id', protect, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the ID
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Component ID is required' 
      });
    }

    const component = await Component.findById(id);
    
    if (!component) {
      return res.status(404).json({ 
        success: false, 
        message: 'Component not found' 
      });
    }

    // Perform the deletion
    await Component.findByIdAndDelete(id);

    res.json({ 
      success: true, 
      message: 'Component deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting component:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error deleting component' 
    });
  }
});

// @desc    Delete component by name
// @route   DELETE /api/cms/components/name/:name
// @access  Private/Admin
router.delete('/name/:name', protect, authorizeAdmin, async (req, res) => {
  try {
    const { name } = req.params;

    // Validate the name
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Component name is required' 
      });
    }

    const component = await Component.findOne({ name });
    
    if (!component) {
      return res.status(404).json({ 
        success: false, 
        message: 'Component not found' 
      });
    }

    // Perform the deletion
    await Component.findOneAndDelete({ name });

    res.json({ 
      success: true, 
      message: 'Component deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting component:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error deleting component' 
    });
  }
});

module.exports = router;

// End of components.js
// Description: End of components routes file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 