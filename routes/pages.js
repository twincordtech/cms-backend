/*
 * File: pages.js
 * Description: Express routes for CMS page content and admin page management.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const express = require('express');
const router = express.Router();
const Page = require('../models/Page');
const Layout = require('../models/Layout');
const { protect, authorizeAdmin } = require('../middleware/authMiddleware');

// Utility to sanitize string input
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.]/g, '').trim();
};

// @desc    Get page content by slug
// @route   GET /api/cms/pages/:slug/content
// @access  Public
router.get('/:slug/content', async (req, res) => {
  try {
    // Find the page by slug
    const page = await Page.findOne({ slug: req.params.slug });
    
    if (!page) {
      return res.status(404).json({
        success: false,
        error: 'Page not found'
      });
    }

    // Find the active layout for this page and populate all necessary data
    const layout = await Layout.findOne({
      page: page._id,
      isActive: true
    })
    .populate({
      path: 'components.componentType',
      model: 'ComponentType'
    });

    if (!layout) {
      // If no layout exists, return just the page data
      return res.json({
        success: true,
        data: {
          page: {
            title: page.title,
            slug: page.slug,
            metaTitle: page.metaTitle,
            metaDescription: page.metaDescription,
            isActive: page.isActive,
            createdAt: page.createdAt,
            updatedAt: page.updatedAt
          },
          layout: null
        }
      });
    }

    // Transform the layout data to include all component information
    const transformedComponents = layout.components.map(component => {
      const componentData = {};
      
      // Get fields from both component and componentType
      const fields = component.fields || {};
      const typeFields = component.componentType ? component.componentType.fields : {};
      const allFields = { ...typeFields, ...fields };

      // Transform each field's data
      Object.entries(allFields).forEach(([fieldName, fieldData]) => {
        if (fieldData.type === 'array' && Array.isArray(fieldData.value)) {
          componentData[fieldName] = {
            type: 'array',
            fieldType: fieldData.fieldType || 'text',
            value: fieldData.value.map(item => {
              if (typeof item === 'object') {
                const transformedItem = {};
                Object.entries(item).forEach(([key, val]) => {
                  transformedItem[key] = {
                    type: val.type || 'text',
                    fieldType: val.fieldType || 'text',
                    value: val.value
                  };
                });
                return transformedItem;
              }
              return item;
            }),
            itemStructure: fieldData.itemStructure || {}
          };
        } else {
          componentData[fieldName] = {
            type: fieldData.type || 'text',
            fieldType: fieldData.fieldType || 'text',
            value: fieldData.value || ''
          };
        }
      });

      return {
        _id: component._id,
        type: component.type,
        name: component.name,
        order: component.order,
        data: componentData,
        fields: allFields
      };
    });

    // Return the complete page content with layout
    res.json({
      success: true,
      data: {
        page: {
          title: page.title,
          slug: page.slug,
          metaTitle: page.metaTitle,
          metaDescription: page.metaDescription,
          isActive: page.isActive,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt
        },
        layout: {
          _id: layout._id,
          name: layout.name,
          isActive: layout.isActive,
          components: transformedComponents
        }
      }
    });

  } catch (error) {
    console.error('Error fetching page content:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching page content'
    });
  }
});

// @desc    Get all pages
// @route   GET /api/pages
// @access  Private/Admin
router.get('/', protect, authorizeAdmin, async (req, res) => {
  try {
    const pages = await Page.find()
      .select('title slug status meta createdAt')
      .sort('-createdAt');

    res.json({
      success: true,
      data: pages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching pages'
    });
  }
});

// ... rest of your existing routes ...

module.exports = router;

// End of pages.js
// Description: End of pages routes file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 