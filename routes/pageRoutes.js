/*
 * File: pageRoutes.js
 * Description: Express routes for page CRUD and content retrieval in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const express = require('express');
const router = express.Router();
const {
  getAllPages,
  getPublishedPages,
  getPageById,
  getPageBySlug,
  createPage,
  updatePage,
  deletePage,
  updatePageOrders
} = require('../controllers/pageController');
const Page = require('../models/Page');
const Layout = require('../models/Layout');
const Component = require('../models/Component');
const { authenticateUser, authorizePermissions } = require('../middleware/authentication');

// Utility to sanitize string input
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.]/g, '').trim();
};

// Public routes
router.get('/published', getPublishedPages);
router.get('/slug/:slug', getPageBySlug);

// Admin routes
router.route('/')
  .get(authenticateUser, authorizePermissions('admin'), getAllPages)
  .post(authenticateUser, authorizePermissions('admin'), createPage);

router.route('/:id')
  .get(authenticateUser, authorizePermissions('admin'), getPageById)
  .put(authenticateUser, authorizePermissions('admin'), updatePage)
  .delete(authenticateUser, authorizePermissions('admin'), deletePage);

router.put('/orders', authenticateUser, authorizePermissions('admin'), updatePageOrders);

// Get page content by slug
router.get('/:slug/content', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Find the page by slug and populate layout with components
    const page = await Page.findOne({ slug })
      .populate({
        path: 'layout',
        populate: {
          path: 'components',
          model: 'Component'
        }
      });

    // Check if page exists
    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    // Check if layout exists
    if (!page.layout) {
      return res.status(404).json({
        success: false,
        message: 'No layout found for this page'
      });
    }

    // Check if components exist
    if (!page.layout.components) {
      return res.status(404).json({
        success: false,
        message: 'No components found in the layout'
      });
    }

    // Transform the layout data into a content-focused format
    const transformedComponents = page.layout.components.map(component => {
      // Initialize empty data object if component.data is undefined
      const componentData = component.data || {};
      const transformedData = {};
      
      // Only process fields if they exist
      if (component.fields && Array.isArray(component.fields)) {
        component.fields.forEach(field => {
          if (field.name) {
            if (field.type === 'array' && field.itemStructure) {
              // Handle array type fields
              transformedData[field.name] = {
                type: 'array',
                fieldType: field.fieldType || field.type,
                value: componentData[field.name]?.value || [],
                itemStructure: field.itemStructure || {}
              };
            } else {
              // Handle regular fields
              transformedData[field.name] = {
                type: field.type || 'text',
                fieldType: field.fieldType || field.type,
                value: componentData[field.name]?.value ?? field.default ?? ''
              };
            }
          }
        });
      }

      return {
        _id: component._id,
        name: component.name,
        type: component.type || 'default',
        data: transformedData,
        fields: component.fields || []
      };
    });

    // Return the formatted response
    res.json({
      success: true,
      data: {
        page: {
          title: page.title,
          slug: page.slug,
          status: page.status,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt
        },
        layout: {
          _id: page.layout._id,
          name: page.layout.name,
          components: transformedComponents
        }
      }
    });
  } catch (error) {
    console.error('Error fetching page content:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching page content',
      error: error.message
    });
  }
});

module.exports = router;

// End of pageRoutes.js
// Description: End of page routes file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 