/*
 * File: componentController.js
 * Description: Handles CRUD operations and management for dynamic components in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const Component = require('../models/Component');
const componentTypes = require('../config/componentTypes');
const { validateObjectId } = require('../utils/validation');

// Create a new component
exports.createComponent = async (req, res) => {
  try {
    const { name, componentType, fields, isActive } = req.body;

    // Validate required fields
    if (!name || !Array.isArray(fields)) {
      return res.status(400).json({
        success: false,
        message: 'Name and fields array are required'
      });
    }

    // Validate fields structure
    const validatedFields = fields.map(field => {
      if (!field.name || !field.type) {
        throw new Error('Each field must have a name and type');
      }

      const validatedField = {
        name: field.name,
        type: field.type,
        required: Boolean(field.required),
        description: field.description || ''
      };

      // Handle select field options
      if (field.type === 'select' && Array.isArray(field.options)) {
        validatedField.options = field.options.map(option => ({
          label: option.label,
          value: option.value
        }));
      }

      // Handle array field subfields
      if (field.type === 'array' && Array.isArray(field.subFields)) {
        validatedField.subFields = field.subFields.map(subField => ({
          name: subField.name,
          type: subField.type,
          required: Boolean(subField.required)
        }));
      }

      return validatedField;
    });

    // Create component with validated fields
    const component = await Component.create({
      name,
      fields: validatedFields,
      isActive: isActive !== false,
      createdBy: req.user._id
    });

    // Populate user information
    await component.populate('createdBy', 'email');

    res.status(201).json({
      success: true,
      data: component
    });
  } catch (error) {
    // Handle errors during component creation
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all components for a page
exports.getPageComponents = async (req, res) => {
  try {
    const { pageId } = req.params;

    // Validate page ID
    if (!validateObjectId(pageId)) {
      return res.status(400).json({ message: 'Invalid page ID' });
    }

    // Fetch all active components for the page
    const components = await Component.find({ 
      pageId,
      isActive: true 
    }).sort('order');

    res.status(200).json({
      success: true,
      data: components
    });
  } catch (error) {
    // Handle errors during component fetch
    res.status(500).json({ message: error.message });
  }
};

// Update a component
exports.updateComponent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find the existing component
    const existingComponent = await Component.findById(id);
    if (!existingComponent) {
      return res.status(404).json({
        success: false,
        message: 'Component not found'
      });
    }

    // Preserve existing data while updating
    const updatedComponent = await Component.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updatedBy: req.user._id,
        // Preserve existing data for fields that aren't being updated
        $set: {
          fields: updateData.fields || existingComponent.fields,
          isActive: updateData.isActive !== undefined ? updateData.isActive : existingComponent.isActive,
          order: updateData.order !== undefined ? updateData.order : existingComponent.order
        }
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedComponent
    });
  } catch (error) {
    // Handle errors during component update
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete a component (soft delete)
exports.deleteComponent = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate component ID
    if (!validateObjectId(id)) {
      return res.status(400).json({ message: 'Invalid component ID' });
    }

    // Find the component to delete
    const component = await Component.findById(id);
    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    // Soft delete by setting isActive to false
    await Component.findByIdAndUpdate(id, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'Component deleted successfully'
    });
  } catch (error) {
    // Handle errors during component deletion
    res.status(500).json({ message: error.message });
  }
};

// Reorder components for a page
exports.reorderComponents = async (req, res) => {
  try {
    const { pageId } = req.params;
    const { componentOrders } = req.body;

    // Validate page ID
    if (!validateObjectId(pageId)) {
      return res.status(400).json({ message: 'Invalid page ID' });
    }

    // Update order for each component
    await Promise.all(
      componentOrders.map(({ id, order }) =>
        Component.findByIdAndUpdate(id, { order })
      )
    );

    // Fetch updated components
    const updatedComponents = await Component.find({ pageId }).sort('order');

    res.status(200).json({
      success: true,
      data: updatedComponents
    });
  } catch (error) {
    // Handle errors during component reordering
    res.status(500).json({ message: error.message });
  }
};

// Get available component types
exports.getComponentTypes = async (req, res) => {
  try {
    // Map component types to their field definitions
    const types = Object.keys(componentTypes).map(type => ({
      type,
      fields: componentTypes[type].fields
    }));

    res.status(200).json({
      success: true,
      data: types
    });
  } catch (error) {
    // Handle errors during component type fetch
    res.status(500).json({ message: error.message });
  }
};

// End of componentController.js
// Description: End of component controller file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private.
