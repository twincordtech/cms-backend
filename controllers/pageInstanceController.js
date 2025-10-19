/*
 * File: pageInstanceController.js
 * Description: Handles CRUD operations and management for page instances in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const PageInstance = require('../models/PageInstance');
const asyncHandler = require('express-async-handler');
const { validateObjectId } = require('../utils/validators');

// @desc    Get all instances for a page
// @route   GET /api/pages/:pageId/instances
// @access  Private
const getPageInstances = asyncHandler(async (req, res) => {
  const { pageId } = req.params;
  
  // Validate page ID format
  if (!validateObjectId(pageId)) {
    return res.status(400).json({ message: 'Invalid page ID' });
  }

  // Fetch all instances for the page with user population
  const instances = await PageInstance.find({ page: pageId })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'email')
    .populate('updatedBy', 'email');

  res.json({
    success: true,
    count: instances.length,
    data: instances
  });
});

// @desc    Create a new page instance
// @route   POST /api/pages/:pageId/instances
// @access  Private
const createPageInstance = asyncHandler(async (req, res) => {
  const { pageId } = req.params;
  const { title, slug, content, status, metadata } = req.body;

  // Validate page ID format
  if (!validateObjectId(pageId)) {
    return res.status(400).json({ message: 'Invalid page ID' });
  }

  // Check if instance with same slug exists for this page
  const existingInstance = await PageInstance.findOne({
    page: pageId,
    slug
  });

  if (existingInstance) {
    return res.status(400).json({ message: 'Instance with this slug already exists' });
  }

  // Create new page instance
  const instance = await PageInstance.create({
    page: pageId,
    title,
    slug,
    content: content || {},
    status: status || 'draft',
    metadata: metadata || {},
    createdBy: req.user._id,
    updatedBy: req.user._id
  });

  res.status(201).json({
    success: true,
    data: instance
  });
});

// @desc    Get a single page instance
// @route   GET /api/pages/:pageId/instances/:id
// @access  Private
const getPageInstance = asyncHandler(async (req, res) => {
  const { pageId, id } = req.params;

  // Validate both page ID and instance ID formats
  if (!validateObjectId(pageId) || !validateObjectId(id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  // Find instance by ID for the specific page
  const instance = await PageInstance.findOne({
    _id: id,
    page: pageId
  }).populate('createdBy', 'email')
    .populate('updatedBy', 'email');

  if (!instance) {
    return res.status(404).json({ message: 'Instance not found' });
  }

  res.json({
    success: true,
    data: instance
  });
});

// @desc    Update a page instance
// @route   PUT /api/pages/:pageId/instances/:id
// @access  Private
const updatePageInstance = asyncHandler(async (req, res) => {
  const { pageId, id } = req.params;
  const { title, slug, content, status, metadata } = req.body;

  // Validate both page ID and instance ID formats
  if (!validateObjectId(pageId) || !validateObjectId(id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  // Find instance by ID for the specific page
  const instance = await PageInstance.findOne({
    _id: id,
    page: pageId
  });

  if (!instance) {
    return res.status(404).json({ message: 'Instance not found' });
  }

  // Check if new slug conflicts with existing instances
  if (slug && slug !== instance.slug) {
    const existingInstance = await PageInstance.findOne({
      page: pageId,
      slug,
      _id: { $ne: id }
    });

    if (existingInstance) {
      return res.status(400).json({ message: 'Instance with this slug already exists' });
    }
  }

  // Update instance fields
  instance.title = title || instance.title;
  instance.slug = slug || instance.slug;
  instance.content = content || instance.content;
  instance.status = status || instance.status;
  instance.metadata = metadata || instance.metadata;
  instance.updatedBy = req.user._id;

  await instance.save();

  res.json({
    success: true,
    data: instance
  });
});

// @desc    Delete a page instance
// @route   DELETE /api/pages/:pageId/instances/:id
// @access  Private
const deletePageInstance = asyncHandler(async (req, res) => {
  const { pageId, id } = req.params;

  // Validate both page ID and instance ID formats
  if (!validateObjectId(pageId) || !validateObjectId(id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  // Find and delete instance by ID for the specific page
  const instance = await PageInstance.findOneAndDelete({
    _id: id,
    page: pageId
  });

  if (!instance) {
    return res.status(404).json({ message: 'Instance not found' });
  }

  res.json({
    success: true,
    data: {}
  });
});

module.exports = {
  getPageInstances,
  createPageInstance,
  getPageInstance,
  updatePageInstance,
  deletePageInstance
};

// End of pageInstanceController.js
// Description: End of page instance controller file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 