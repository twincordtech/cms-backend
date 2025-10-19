/*
 * File: componentRoutes.js
 * Description: Express routes for component CRUD and type management in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createComponent,
  getPageComponents,
  updateComponent,
  deleteComponent,
  reorderComponents,
  getComponentTypes
} = require('../controllers/componentController');
const Component = require('../models/Component');

// Utility to sanitize string input
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.]/g, '').trim();
};

// Get component types (public)
router.get('/types', getComponentTypes);

// Protected routes
router.use(protect);
router.use(authorize('admin'));

// CRUD operations
router.post('/', (req, res, next) => {
  if (req.body && req.body.name) req.body.name = sanitizeString(req.body.name);
  next();
}, createComponent);
router.get('/page/:pageId', (req, res, next) => {
  req.params.pageId = sanitizeString(req.params.pageId);
  next();
}, getPageComponents);
router.put('/:id', (req, res, next) => {
  req.params.id = sanitizeString(req.params.id);
  if (req.body && req.body.name) req.body.name = sanitizeString(req.body.name);
  next();
}, updateComponent);
router.delete('/:id', (req, res, next) => {
  req.params.id = sanitizeString(req.params.id);
  next();
}, deleteComponent);

// Reordering
router.put('/page/:pageId/reorder', (req, res, next) => {
  req.params.pageId = sanitizeString(req.params.pageId);
  next();
}, reorderComponents);

// Get all components
router.get('/', async (req, res) => {
  try {
    const components = await Component.find()
      .select('name fields createdAt updatedAt')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: components
    });
  } catch (error) {
    console.error('Error fetching components:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch components',
      error: error.message
    });
  }
});

// Create new component
router.post('/', async (req, res) => {
  try {
    const { name, fields, isBasedOn } = req.body;

    // Validate required fields
    if (!name || !fields || !Array.isArray(fields)) {
      return res.status(400).json({
        success: false,
        message: 'Name and fields array are required'
      });
    }

    // If this is based on an existing component, record that information
    const componentData = {
      name,
      fields,
      createdBy: req.user._id
    };

    if (isBasedOn) {
      componentData.isBasedOn = isBasedOn;
    }

    const component = new Component(componentData);
    await component.save();

    res.status(201).json({
      success: true,
      message: 'Component created successfully',
      data: component
    });
  } catch (error) {
    console.error('Error creating component:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create component',
      error: error.message
    });
  }
});

// Get component by ID
router.get('/:id', async (req, res) => {
  try {
    const component = await Component.findById(req.params.id);
    
    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'Component not found'
      });
    }

    res.json({
      success: true,
      data: component
    });
  } catch (error) {
    console.error('Error fetching component:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch component',
      error: error.message
    });
  }
});

// Update component
router.put('/:id', async (req, res) => {
  try {
    const { name, fields } = req.body;

    // Validate required fields
    if (!name || !fields || !Array.isArray(fields)) {
      return res.status(400).json({
        success: false,
        message: 'Name and fields array are required'
      });
    }

    const component = await Component.findByIdAndUpdate(
      req.params.id,
      { name, fields, updatedBy: req.user._id },
      { new: true }
    );

    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'Component not found'
      });
    }

    res.json({
      success: true,
      message: 'Component updated successfully',
      data: component
    });
  } catch (error) {
    console.error('Error updating component:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update component',
      error: error.message
    });
  }
});

// Delete component
router.delete('/:id', async (req, res) => {
  try {
    const component = await Component.findByIdAndDelete(req.params.id);
    
    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'Component not found'
      });
    }

    res.json({
      success: true,
      message: 'Component deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting component:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete component',
      error: error.message
    });
  }
});

module.exports = router;

// End of componentRoutes.js
// Description: End of component routes file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 