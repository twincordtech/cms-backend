/*
 * File: cms.js
 * Description: Express routes for CMS core features, including pages, sections, media, layouts, and components.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const express = require('express');
const Section = require('../models/Section');
const Page = require('../models/Page');
const { protect, authorizeAdmin } = require('../middleware/authMiddleware');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const MediaFolder = require('../models/MediaFolder');
const Media = require('../models/Media');
const componentTypes = require('../config/componentTypes');
const ComponentType = require('../models/ComponentType');
const Component = require('../models/Component');
const Layout = require('../models/Layout');
const inquiryRoutes = require('./inquiryRoutes');

// Utility to sanitize string input
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.]/g, '').trim();
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/media');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      console.log('Upload directory ensured:', uploadDir);
      cb(null, uploadDir);
    } catch (error) {
      console.error('Error creating upload directory:', error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + path.extname(file.originalname);
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
    'image/webp', 'image/avif', 'image/svg+xml', 'image/bmp', 'image/tiff',
    // Videos
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  // Accept all image formats
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  }
  // For non-image files, check against the list
  else if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed types: All images, MP4, PDF, DOC, DOCX'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// PAGE ROUTES

// @desc    Get all published pages
// @route   GET /api/cms/pages
// @access  Public
router.get('/pages', async (req, res) => {
  try {
    const pages = await Page.find({ isActive: true }).sort('-createdAt');
    const formattedPages = pages.map(page => ({
      ...page.toObject(),
      pageType: page.isMultiPage ? 'Dynamic' : 'Static'
    }));
    
    res.status(200).json({
      success: true,
      statusCode: 6000,
      count: pages.length,
      data: formattedPages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 5000,
      message: error.message
    });
  }
});

// @desc    Get all pages (including drafts) - admin only
// @route   GET /api/cms/admin/pages
// @access  Private/Admin
router.get('/admin/pages', protect, authorizeAdmin, async (req, res) => {
  try {
    const pages = await Page.find().sort('-createdAt');
    const formattedPages = pages.map(page => ({
      ...page.toObject(),
      pageType: page.isMultiPage ? 'Dynamic' : 'Static'
    }));

    res.status(200).json({
      success: true,
      statusCode: 6000,
      count: pages.length,
      data: formattedPages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 5000,
      message: error.message
    });
  }
});

// @desc    Get page by ID
// @route   GET /api/cms/admin/pages/:id
// @access  Private/Admin
router.get('/admin/pages/:id', protect, authorizeAdmin, async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }
    res.status(200).json({
      success: true,
      data: page
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Create new page
// @route   POST /api/cms/admin/pages
// @access  Private/Admin
router.post('/admin/pages', protect, authorizeAdmin, async (req, res) => {
  try {
    let { title, slug, status, isMultiPage } = req.body;
    title = sanitizeString(title);
    slug = sanitizeString(slug);
    status = sanitizeString(status);
    const page = await Page.create({
      title,
      slug,
      status,
      isMultiPage: isMultiPage || false,
      createdBy: req.user._id
    });
    const formattedPage = {
      ...page.toObject(),
      pageType: page.isMultiPage ? 'Dynamic' : 'Static'
    };
    res.status(201).json({
      success: true,
      statusCode: 6000,
      data: formattedPage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 5000,
      message: error.message
    });
  }
});

// @desc    Update page
// @route   PUT /api/cms/admin/pages/:id
// @access  Private/Admin
router.put('/admin/pages/:id', protect, authorizeAdmin, async (req, res) => {
  try {
    let { title, slug, status, isMultiPage, isActive } = req.body;
    title = sanitizeString(title);
    slug = sanitizeString(slug);
    status = sanitizeString(status);
    const page = await Page.findByIdAndUpdate(
      sanitizeString(req.params.id),
      { 
        title,
        slug,
        status,
        isMultiPage: isMultiPage || false,
        isActive: typeof isActive === 'boolean' ? isActive : true,
        updatedBy: req.user._id 
      },
      { new: true, runValidators: true }
    );
    if (!page) {
      return res.status(404).json({
        success: false,
        statusCode: 5001,
        message: 'Page not found'
      });
    }
    const formattedPage = {
      ...page.toObject(),
      pageType: page.isMultiPage ? 'Dynamic' : 'Static'
    };
    res.status(200).json({
      success: true,
      statusCode: 6000,
      data: formattedPage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 5000,
      message: error.message
    });
  }
});

// @desc    Delete page
// @route   DELETE /api/cms/admin/pages/:id
// @access  Private/Admin
router.delete('/admin/pages/:id', protect, authorizeAdmin, async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }
    await page.deleteOne();
    res.status(200).json({
      success: true,
      message: 'Page deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get page by slug
// @route   GET /api/cms/pages/:slug
// @access  Public
router.get('/pages/:slug', async (req, res) => {
  try {
    const page = await Page.findOne({ 
      slug: req.params.slug,
      isActive: true
    });
    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }
    res.status(200).json({
      success: true,
      data: page
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get page with sections by slug
// @route   GET /api/cms/pages/:slug/content
// @access  Public
router.get('/pages/:slug/content', async (req, res) => {
  try {
    const page = await Page.findOne({ 
      slug: req.params.slug,
      isActive: true 
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        statusCode: 5001,
        message: 'Page not found'
      });
    }

    // Find all layouts for this page
    const layouts = await Layout.find({ 
      page: page._id,
      isActive: true 
    })
    .populate({
      path: 'components',
      model: 'Component'
    });

    // Helper function to transform nested data
    const transformData = (data) => {
      if (!data) return data;
      
      if (Array.isArray(data)) {
        return data.map(item => transformData(item));
      }
      
      if (typeof data === 'object') {
        // If it's a field object with value, type, and fieldType
        if (data.value !== undefined && data.type !== undefined && data.fieldType !== undefined) {
          return data.value;
        }
        
        // If it's a regular object, transform its properties
        const transformed = {};
        Object.entries(data).forEach(([key, value]) => {
          transformed[key] = transformData(value);
        });
        return transformed;
      }
      
      return data;
    };

    // Transform layouts and their components
    const transformedLayouts = layouts.map(layout => {
      const componentsObj = {};
      
      layout.components.forEach(component => {
        const transformedData = transformData(component.data);
        
        // Add component to components object
        componentsObj[component.name] = {
          _id: component._id,
          type: component.type,
          name: component.name,
          order: component.order,
          data: transformedData
        };
      });

      return {
        _id: layout._id,
        name: layout.name,
        isActive: layout.isActive,
        components: componentsObj
      };
    });

    // Format the response
    const response = {
      success: true,
      statusCode: 6000,
      data: {
        page: {
          title: page.title,
          slug: page.slug,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt
        },
        layouts: transformedLayouts
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching page content:', error);
    res.status(500).json({
      success: false,
      statusCode: 5000,
      message: error.message
    });
  }
});

// @desc    Get page with sections by slug (Admin version with all sections)
// @route   GET /api/cms/admin/pages/:slug/content
// @access  Private/Admin
router.get('/admin/pages/:slug/content', protect, authorizeAdmin, async (req, res) => {
  try {
    // Find the page by slug
    const page = await Page.findOne({ 
      slug: req.params.slug 
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        statusCode: 5001,
        message: 'Page not found'
      });
    }

    // Find all layouts for this page
    const layouts = await Layout.find({ 
      page: page._id,
    }).populate({
      path: 'components',
      model: 'Component'
    });

    // Get component types for field validation
    const componentTypes = await ComponentType.find({});
    const componentTypeMap = componentTypes.reduce((acc, type) => {
      acc[type.name] = type;
      return acc;
    }, {});

    // Transform layouts and their components
    const transformedLayouts = layouts.map(layout => ({
      _id: layout._id,
      name: layout.name,
      components: layout.components.map(component => {
        const componentType = componentTypeMap[component.type];
        const fields = componentType ? componentType.fields : [];

        return {
          _id: component._id,
          type: component.type,
          name: component.name,
          order: component.order,
          data: Object.entries(component.data || {}).reduce((acc, [key, value]) => {
            if (value.type === 'array') {
              acc[key] = {
                type: value.type,
                fieldType: value.fieldType || 'array',
                value: value.value || [],
                itemStructure: value.itemStructure || fields.find(f => f.name === key)?.itemStructure || []
              };
            } else {
              acc[key] = {
                type: value.type || 'text',
                fieldType: value.fieldType || 'text',
                value: value.value || ''
              };
            }
            return acc;
          }, {}),
          fields: fields.map(field => ({
            name: field.name,
            type: field.type,
            fieldType: field.fieldType,
            default: field.default,
            ...(field.type === 'array' && { itemStructure: field.itemStructure })
          }))
        };
      }),
      isActive: layout.isActive,
      createdBy: {
        _id: layout.createdBy,
        email: layout.createdBy?.email
      },
      createdAt: layout.createdAt,
      updatedAt: layout.updatedAt
    }));

    // Construct the new response format
    const response = {
      success: true,
      statusCode: 6000,
      data: {
        page: {
          _id: page._id,
          title: page.title,
          slug: page.slug,
          isMultiPage: page.isMultiPage
        },
        layouts: transformedLayouts
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching page content:', error);
    res.status(500).json({
      success: false,
      statusCode: 5000,
      message: error.message
    });
  }
});

// SECTION ROUTES

// @desc    Get all sections
// @route   GET /api/cms/sections
// @access  Public
router.get('/sections', async (req, res) => {
  try {
    const sections = await Section.find({ isActive: true })
      .sort({ order: 1 })
      .select('-versions');
    
    res.status(200).json({
      success: true,
      count: sections.length,
      data: sections
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get all sections (including inactive ones) - admin only
// @route   GET /api/cms/admin/sections
// @access  Private/Admin
router.get('/admin/sections', protect, authorizeAdmin, async (req, res) => {
  try {
    const sections = await Section.find()
      .sort({ order: 1 })
      .populate('createdBy', 'email');
    
    res.status(200).json({
      success: true,
      count: sections.length,
      data: sections
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get section by ID
// @route   GET /api/cms/sections/:id
// @access  Private/Admin
router.get('/admin/sections/:id', protect, authorizeAdmin, async (req, res) => {
  try {
    const section = await Section.findById(req.params.id)
      .populate('createdBy', 'email')
      .populate('versions.updatedBy', 'email');
    
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Create new section
// @route   POST /api/cms/sections
// @access  Private/Admin
router.post('/admin/sections', protect, authorizeAdmin, async (req, res) => {
  try {
    let { type, data, pageId } = req.body;
    type = sanitizeString(type);
    pageId = sanitizeString(pageId);
    // Validate required fields
    if (!pageId) {
      return res.status(400).json({
        success: false,
        message: 'Section validation failed: pageId: Page association is required'
      });
    }
    // Verify page exists
    const page = await Page.findById(pageId);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: `No page found with id ${pageId}`
      });
    }
    // Get highest order number for this page
    const highestOrder = await Section.findOne({ pageId })
      .sort({ order: -1 })
      .select('order');
    const order = highestOrder ? highestOrder.order + 1 : 0;
    // Create section
    const section = await Section.create({
      type,
      data,
      pageId,
      order,
      createdBy: req.user._id
    });
    res.status(201).json({
      success: true,
      data: section
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update section
// @route   PUT /api/cms/sections/:id
// @access  Private/Admin
router.put('/admin/sections/:id', protect, authorizeAdmin, async (req, res) => {
  try {
    let { type, data, isActive } = req.body;
    type = sanitizeString(type);
    const sectionId = sanitizeString(req.params.id);
    let section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }
    // Update section
    if (type) section.type = type;
    if (data) section.data = data;
    if (isActive !== undefined) section.isActive = isActive;
    // Store updater ID for version history
    section.updatedBy = req.user._id;
    section = await section.save();
    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Delete section
// @route   DELETE /api/cms/sections/:id
// @access  Private/Admin
router.delete('/admin/sections/:id', protect, authorizeAdmin, async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);
    
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }
    
    // Use deleteOne instead of remove (which is deprecated)
    await Section.deleteOne({ _id: req.params.id });
    
    // Reorder remaining sections
    const sections = await Section.find().sort({ order: 1 });
    
    for (let i = 0; i < sections.length; i++) {
      sections[i].order = i;
      await sections[i].save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Section deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update sections order
// @route   PUT /api/cms/sections/order
// @access  Private/Admin
router.put('/admin/sections/order', protect, authorizeAdmin, async (req, res) => {
  try {
    const { sectionIds } = req.body;
    
    if (!Array.isArray(sectionIds)) {
      return res.status(400).json({
        success: false,
        message: 'sectionIds must be an array'
      });
    }
    
    // Update order for each section
    for (let i = 0; i < sectionIds.length; i++) {
      await Section.findByIdAndUpdate(sectionIds[i], { order: i });
    }
    
    const sections = await Section.find()
      .sort({ order: 1 })
      .select('-versions');
    
    res.status(200).json({
      success: true,
      message: 'Sections reordered successfully',
      data: sections
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Restore section version
// @route   PUT /api/cms/sections/:id/restore/:versionIndex
// @access  Private/Admin
router.put('/admin/sections/:id/restore/:versionIndex', protect, authorizeAdmin, async (req, res) => {
  try {
    const { id, versionIndex } = req.params;
    
    const section = await Section.findById(id);
    
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }
    
    // Check if version exists
    if (!section.versions[versionIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Version not found'
      });
    }
    
    // Restore version
    const versionData = section.versions[versionIndex].data;
    section.data = versionData;
    section.updatedBy = req.user._id;
    
    await section.save();
    
    res.status(200).json({
      success: true,
      message: 'Version restored successfully',
      data: section
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get sections stats
// @route   GET /api/cms/sections/stats
// @access  Private
router.get('/sections/stats', protect, async (req, res) => {
  try {
    const total = await Section.countDocuments();
    const published = await Section.countDocuments({ isActive: true });
    const drafts = await Section.countDocuments({ isActive: false });

    res.status(200).json({
      success: true,
      stats: {
        total,
        published,
        drafts
      }
    });
  } catch (error) {
    console.error('Get Section Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching section stats'
    });
  }
});

// @desc    Get recent sections
// @route   GET /api/cms/sections/recent
// @access  Private
router.get('/sections/recent', protect, async (req, res) => {
  try {
    const sections = await Section.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('pageId', 'title slug');

    res.status(200).json({
      success: true,
      sections
    });
  } catch (error) {
    console.error('Get Recent Sections Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent sections'
    });
  }
});

// Get all folders
router.get('/folders', protect, async (req, res) => {
  try {
    const folders = await MediaFolder.find()
      .populate('parent', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ message: 'Failed to fetch folders' });
  }
});

// Create new folder
router.post('/folders', protect, async (req, res) => {
  try {
    let { name, description, parent } = req.body;
    name = sanitizeString(name);
    description = sanitizeString(description);
    parent = parent ? sanitizeString(parent) : null;
    const folder = new MediaFolder({
      name,
      description,
      parent: parent || null,
      createdBy: req.user._id
    });
    await folder.save();
    res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete folder
router.delete('/folders/:id', protect, authorizeAdmin, async (req, res) => {
  try {
    const folder = await MediaFolder.findById(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Check if folder has files
    const filesCount = await Media.countDocuments({ folder: folder._id });
    if (filesCount > 0) {
      return res.status(400).json({ message: 'Cannot delete folder containing files' });
    }

    await folder.deleteOne();
    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ message: 'Failed to delete folder' });
  }
});

// Get files (with optional folder filter)
router.get('/files', protect, async (req, res) => {
  try {
    const query = {};
    if (req.query.folder) {
      query.folder = req.query.folder;
    }
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const files = await Media.find(query)
      .populate('folder', 'name')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ message: 'Failed to fetch files' });
  }
});

// Upload file
router.post('/files', protect, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    if (!req.body.folder) {
      return res.status(400).json({ message: 'Folder is required' });
    }
    // Check if folder exists
    const folderId = sanitizeString(req.body.folder);
    const folder = await MediaFolder.findById(folderId);
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    const uploadedFiles = [];
    // Process each file
    for (const file of req.files) {
      const newFile = new Media({
        name: sanitizeString(file.originalname),
        description: req.body.description ? sanitizeString(req.body.description) : '',
        type: req.body.type ? sanitizeString(req.body.type) : 'image',
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/media/${file.filename}`,
        folder: folderId,
        uploadedBy: req.user._id
      });
      await newFile.save();
      uploadedFiles.push(newFile);
    }
    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} files uploaded successfully`,
      data: uploadedFiles
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update file
router.put('/files/:id', protect, upload.single('file'), async (req, res) => {
  try {
    console.log('PUT /files/:id - Request received');
    console.log('File ID:', req.params.id);
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);
    
    const fileId = req.params.id;
    const existingFile = await Media.findById(fileId);
    
    if (!existingFile) {
      console.log('File not found:', fileId);
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user is the owner of the file or an admin
    if (existingFile.uploadedBy.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this file' });
    }

    console.log('Existing file:', existingFile);

    // Prepare update data
    const updateData = {
      name: req.body.name || existingFile.name,
      description: req.body.description || existingFile.description,
      type: req.body.type || existingFile.type,
      folder: req.body.folder || existingFile.folder
    };

    // Ensure URL has correct format if no new file is uploaded
    if (!req.file && existingFile.url) {
      // If the URL doesn't start with /uploads/media/, fix it
      if (!existingFile.url.startsWith('/uploads/media/')) {
        // If it's just a filename, add the prefix
        if (!existingFile.url.includes('/')) {
          updateData.url = `/uploads/media/${existingFile.url}`;
        } else {
          // If it has some path but not the correct prefix, extract filename and add prefix
          const filename = existingFile.url.split('/').pop();
          updateData.url = `/uploads/media/${filename}`;
        }
        console.log('Fixed URL format:', existingFile.url, '->', updateData.url);
      }
    }

    console.log('Raw folder value from request:', req.body.folder);
    console.log('Folder type:', typeof req.body.folder);
    console.log('Folder value:', req.body.folder);

    console.log('Update data:', updateData);

    // If a new file was uploaded, update file-related fields
    if (req.file) {
      console.log('New file uploaded:', req.file.originalname);
      
      // Delete the old file if it exists
      if (existingFile.url) {
        const oldFilePath = path.join(__dirname, '..', existingFile.url);
        console.log('Old file path:', oldFilePath);
        try {
          // Check if file exists before trying to delete
          const fsSync = require('fs');
          if (fsSync.existsSync(oldFilePath)) {
            fsSync.unlinkSync(oldFilePath);
            console.log('Old file deleted successfully');
          } else {
            console.log('Old file does not exist at path:', oldFilePath);
          }
        } catch (error) {
          console.log('Error deleting old file:', error);
          // Don't fail the update if old file deletion fails
        }
      }

      // Update with new file information
      updateData.url = `/uploads/media/${req.file.filename}`;
      updateData.size = req.file.size;
      updateData.mimeType = req.file.mimetype;
      
      console.log('Updated file info:', {
        url: updateData.url,
        size: updateData.size,
        mimeType: updateData.mimeType
      });
    } else {
      // If no new file uploaded, ensure MIME type is correct
      if (existingFile.mimeType && !existingFile.mimeType.includes('/')) {
        // Fix malformed MIME type (e.g., "imagepng" -> "image/png")
        const fileExtension = existingFile.url ? existingFile.url.split('.').pop() : '';
        if (fileExtension) {
          const mimeTypeMap = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'webp': 'image/webp',
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          };
          updateData.mimeType = mimeTypeMap[fileExtension.toLowerCase()] || existingFile.mimeType;
          console.log('Fixed MIME type:', existingFile.mimeType, '->', updateData.mimeType);
        }
      }
    }

    console.log('Final update data:', updateData);

    const updatedFile = await Media.findByIdAndUpdate(
      fileId,
      updateData,
      { new: true }
    ).populate('folder', 'name').populate('uploadedBy', 'name');

    console.log('File updated successfully:', updatedFile);
    res.json(updatedFile);
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete file
router.delete('/files/:id', protect, async (req, res) => {
  try {
    const file = await Media.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Check if user is the owner of the file or an admin
    if (file.uploadedBy.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this file' });
    }

    // Delete physical file
    const filePath = path.join(__dirname, '..', file.url);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting physical file:', error);
    }

    await file.deleteOne();
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Failed to delete file' });
  }
});

// Get component types
router.get('/component-types', protect, async (req, res) => {
  try {
    // Get predefined component types
    const predefinedTypes = await ComponentType.find({ isActive: true });
    
    // Get custom components
    const customComponents = await Component.find({ isActive: true })
      .select('name fields')
      .populate('createdBy', 'name email');

    // Convert predefined types to object format
    const predefinedTypesObject = predefinedTypes.reduce((acc, type) => {
      acc[type.name] = {
        fields: type.fields,
        isPredefined: true
      };
      return acc;
    }, {});

    // Convert custom components to object format
    const customComponentsObject = customComponents.reduce((acc, component) => {
      acc[component.name] = {
        fields: component.fields,
        isPredefined: false,
        createdBy: component.createdBy
      };
      return acc;
    }, {});

    // Merge both objects
    const componentTypesObject = {
      ...predefinedTypesObject,
      ...customComponentsObject
    };

    res.json({
      success: true,
      data: componentTypesObject
    });
  } catch (error) {
    console.error('Error fetching component types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch component types'
    });
  }
});

// Add new component type (admin only)
router.post('/component-types', protect, authorizeAdmin, async (req, res) => {
  try {
    const componentType = await ComponentType.create(req.body);
    res.status(201).json({
      success: true,
      data: componentType
    });
  } catch (error) {
    console.error('Error creating component type:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update component type (admin only)
router.put('/component-types/:id', protect, authorizeAdmin, async (req, res) => {
  try {
    const componentType = await ComponentType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!componentType) {
      return res.status(404).json({
        success: false,
        message: 'Component type not found'
      });
    }

    res.json({
      success: true,
      data: componentType
    });
  } catch (error) {
    console.error('Error updating component type:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete component type (admin only)
router.delete('/component-types/:id', protect, authorizeAdmin, async (req, res) => {
  try {
    const componentType = await ComponentType.findByIdAndDelete(req.params.id);
    
    if (!componentType) {
      return res.status(404).json({
        success: false,
        message: 'Component type not found'
      });
    }

    res.json({
      success: true,
      message: 'Component type deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting component type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete component type'
    });
  }
});

// Component Routes

// @desc    Get all components
// @route   GET /api/cms/components
// @access  Private
router.get('/components', protect, async (req, res) => {
  try {
    const components = await Component.find()
      .populate('page', 'title slug')
      .populate('createdBy', 'name email')
      .select('name fieldType fields isActive createdAt updatedAt createdBy updatedBy order')
      .sort({ order: 1 });

    res.json({
      success: true,
      data: components
    });
  } catch (error) {
    console.error('Error fetching components:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch components'
    });
  }
});

// @desc    Get components by page ID
// @route   GET /api/cms/components/page/:pageId
// @access  Private
router.get('/components/page/:pageId', protect, async (req, res) => {
  try {
    const components = await Component.find({ page: req.params.pageId })
      .populate('page', 'title slug')
      .populate('createdBy', 'name email')
      .sort({ order: 1 });

    res.json({
      success: true,
      data: components
    });
  } catch (error) {
    console.error('Error fetching page components:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch page components'
    });
  }
});

// @desc    Create new component
// @route   POST /api/cms/components
// @access  Private/Admin
router.post('/components', protect, authorizeAdmin, async (req, res) => {
  try {
    const { name, fields, isActive, fieldType } = req.body;

    // Validate required fields
    if (!name || !Array.isArray(fields) || !fieldType) {
      return res.status(400).json({
        success: false,
        message: 'Name, fieldType, and fields array are required'
      });
    }

    // Create component with validated fields
    const component = await Component.create({
      name,
      fieldType,
      fields,
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
    console.error('Error creating component:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update component
// @route   PUT /api/cms/components/:id
// @access  Private/Admin
router.put('/components/:id', protect, authorizeAdmin, async (req, res) => {
  try {
    const component = await Component.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id },
      { new: true, runValidators: true }
    )
      .populate('page', 'title slug')
      .populate('createdBy', 'name email');

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
    console.error('Error updating component:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Delete component
// @route   DELETE /api/cms/components/:id
// @access  Private/Admin
router.delete('/components/:id', protect, authorizeAdmin, async (req, res) => {
  try {
    const component = await Component.findById(req.params.id);

    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'Component not found'
      });
    }

    await component.deleteOne();

    res.json({
      success: true,
      message: 'Component deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting component:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete component'
    });
  }
});

// @desc    Reorder components
// @route   PUT /api/cms/components/page/:pageId/reorder
// @access  Private/Admin
router.put('/components/page/:pageId/reorder', protect, authorizeAdmin, async (req, res) => {
  try {
    const { componentOrders } = req.body;

    for (const order of componentOrders) {
      await Component.findByIdAndUpdate(order.componentId, { order: order.order });
    }

    const components = await Component.find({ page: req.params.pageId })
      .populate('page', 'title slug')
      .populate('createdBy', 'name email')
      .sort({ order: 1 });

    res.json({
      success: true,
      data: components
    });
  } catch (error) {
    console.error('Error reordering components:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder components'
    });
  }
});

// @desc    Update layout
// @route   PUT /api/layouts/:id
// @access  Private/Admin
router.put('/layouts/:id', protect, authorizeAdmin, async (req, res) => {
  try {
    const { components } = req.body;
    
    console.log('🔍 PUT /layouts/:id - Request received for layout ID:', req.params.id);

    if (components && Array.isArray(components)) {
      console.log(`🔍 Processing ${components.length} components`);
      
      await Promise.all(components.map(async (component) => {
        const updatedData = {};
        console.log(`🔍 Processing component: ${component.name} (ID: ${component._id})`);
        
        // Check for image fields in this component's data
        const imageFields = [];
        const arrayFieldsWithImages = [];
        
        // Transform and store the data
        Object.entries(component.data || {}).forEach(([fieldName, fieldData]) => {
          // Track image fields for debugging
          if (fieldData?.type === 'image' || fieldData?.fieldType === 'image') {
            imageFields.push({ 
              name: fieldName, 
              value: fieldData.value || null,
              type: fieldData.type,
              fieldType: fieldData.fieldType
            });
          }
          
          if (fieldData?.type === 'array') {
            const hasNestedImages = (fieldData.value || []).some(item => {
              if (typeof item !== 'object') return false;
              return Object.values(item).some(
                val => val?.type === 'image' || val?.fieldType === 'image'
              );
            });
            
            if (hasNestedImages) {
              arrayFieldsWithImages.push(fieldName);
            }
          }
          
          if (fieldData?.type === 'array') {
            // Ensure the value is an array
            const arrayValue = Array.isArray(fieldData.value) ? fieldData.value : [];
            
            updatedData[fieldName] = {
              type: fieldData.type,
              fieldType: fieldData.fieldType || 'array',
              value: arrayValue.map(item => {
                if (typeof item === 'object') {
                  const transformedItem = {};
                  Object.entries(item).forEach(([key, val]) => {
                    // For image fields in arrays, ensure proper structure is maintained
                    if (val?.type === 'image' || val?.fieldType === 'image') {
                      console.log(`🖼️ Found nested image field in array: ${fieldName}[].${key} = ${val.value || 'empty'}`);
                    transformedItem[key] = {
                        type: 'image',
                        fieldType: 'image',
                      value: val.value || ''
                    };
                    } else {
                      transformedItem[key] = {
                        type: val?.type || 'text',
                        fieldType: val?.fieldType || 'text',
                        value: val?.value || ''
                      };
                    }
                  });
                  return transformedItem;
                }
                return item;
              }),
              itemStructure: fieldData.itemStructure || []
            };
          } else if (fieldData?.type === 'image' || fieldData?.fieldType === 'image') {
            // Special handling for image fields
            console.log(`🖼️ Processing image field: ${fieldName} = ${fieldData.value || 'empty'}`);
            
            // Ensure image fields maintain their structure even if value is empty
            updatedData[fieldName] = {
              type: 'image',
              fieldType: 'image',
              value: fieldData.value || ''
            };
          } else {
            // Standard field handling
            updatedData[fieldName] = {
              type: fieldData.type || 'text',
              fieldType: fieldData.fieldType || 'text',
              value: fieldData.value || ''
            };
          }
        });

        // Log image field processing
        if (imageFields.length > 0) {
          console.log(`🖼️ Found ${imageFields.length} direct image fields in component ${component.name}:`, 
            imageFields.map(f => `${f.name}=${f.value || 'empty'}`).join(', ')
          );
        }
        
        if (arrayFieldsWithImages.length > 0) {
          console.log(`🖼️ Found images in these array fields of component ${component.name}:`, 
            arrayFieldsWithImages.join(', ')
          );
        }
        
        console.log(`📝 About to update component ${component._id} with processed data`);
        
        // Update the component in the database
        const updatedComponent = await Component.findByIdAndUpdate(
          component._id,
          { 
            $set: {
              data: updatedData,
              order: component.order,
              type: component.type,
              name: component.name
            }
          },
          { new: true }
        );
        
        if (!updatedComponent) {
          console.error(`❌ Failed to update component ${component._id} - not found in database`);
        } else {
          console.log(`✅ Successfully updated component ${component._id}`);
          
          // Verify image fields were saved properly
          Object.entries(updatedComponent.data || {}).forEach(([key, value]) => {
            if (value?.type === 'image' || value?.fieldType === 'image') {
              console.log(`🔍 Verified image field ${key} = ${value.value || 'empty'} was saved`);
            }
            
            if (value?.type === 'array') {
              const hasImages = (value.value || []).some(item => {
                if (typeof item !== 'object') return false;
                return Object.values(item).some(
                  val => val?.type === 'image' || val?.fieldType === 'image'
                );
              });
              
              if (hasImages) {
                console.log(`🔍 Verified array field ${key} with images was saved`);
              }
            }
          });
        }
      }));
    }

    const updatedLayout = await Layout.findById(req.params.id)
      .populate('page', 'title slug')
      .populate('createdBy', 'email')
      .populate({
        path: 'components',
        model: 'Component'
      });

    if (!updatedLayout) {
      console.error(`❌ Layout ${req.params.id} not found after updates`);
      return res.status(404).json({
        success: false,
        statusCode: 5001,
        message: 'Layout not found'
      });
    }

    console.log(`✅ Layout ${req.params.id} updated successfully`);

    const componentTypes = await ComponentType.find({});
    const componentTypeMap = componentTypes.reduce((acc, type) => {
      acc[type.name] = type;
      return acc;
    }, {});

    const transformedResponse = {
      success: true,
      statusCode: 6000,
      data: {
        _id: updatedLayout._id,
        name: updatedLayout.name,
        page: {
          _id: updatedLayout.page._id,
          title: updatedLayout.page.title,
          slug: updatedLayout.page.slug
        },
        components: updatedLayout.components.map(component => {
          const componentType = componentTypeMap[component.type];
          const fields = componentType ? componentType.fields : [];

          return {
            _id: component._id,
            type: component.type,
            name: component.name,
            order: component.order,
            data: Object.entries(component.data || {}).reduce((acc, [key, value]) => {
              if (value.type === 'array') {
                acc[key] = {
                  type: value.type,
                  fieldType: value.fieldType || 'array',
                  value: value.value || [],
                  itemStructure: value.itemStructure || fields.find(f => f.name === key)?.itemStructure || []
                };
              } else {
                acc[key] = {
                  type: value.type || 'text',
                  fieldType: value.fieldType || 'text',
                  value: value.value || ''
                };
              }
              return acc;
            }, {}),
            fields: fields.map(field => ({
              name: field.name,
              type: field.type,
              fieldType: field.fieldType,
              default: field.default,
              ...(field.type === 'array' && { itemStructure: field.itemStructure })
            }))
          };
        }),
        isActive: updatedLayout.isActive,
        createdBy: {
          _id: updatedLayout.createdBy._id,
          email: updatedLayout.createdBy.email
        },
        createdAt: updatedLayout.createdAt,
        updatedAt: updatedLayout.updatedAt,
        __v: updatedLayout.__v,
        updatedBy: req.user._id
      }
    };

    res.json(transformedResponse);
  } catch (error) {
    console.error('❌ Error updating layout:', error);
    res.status(500).json({
      success: false,
      statusCode: 5000,
      message: error.message
    });
  }
});

router.use('/inquiries', inquiryRoutes);

module.exports = router;

// End of cms.js
// Description: End of CMS routes file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 