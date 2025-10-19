/*
 * File: sectionController.js
 * Description: Handles CRUD operations and management for page sections in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const Section = require('../models/Section');
const Page = require('../models/Page');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../errors');

// Get all sections with sorting
const getAllSections = async (req, res) => {
  // Fetch all sections sorted by order
  const sections = await Section.find({}).sort('order');
  res.status(StatusCodes.OK).json({ success: true, data: sections });
};

// Get sections by page ID with page validation
const getSectionsByPage = async (req, res) => {
  const { pageId } = req.params;
  
  // Verify page exists before fetching sections
  const page = await Page.findOne({ _id: pageId });
  if (!page) {
    throw new NotFoundError(`No page found with id ${pageId}`);
  }
  
  // Fetch sections for the page sorted by order
  const sections = await Section.find({ pageId }).sort('order');
  res.status(StatusCodes.OK).json({ success: true, data: sections });
};

// Get published sections by page ID with page validation
const getPublishedSectionsByPage = async (req, res) => {
  const { pageId } = req.params;
  
  // Verify page exists and is active before fetching sections
  const page = await Page.findOne({ _id: pageId, isActive: true });
  if (!page) {
    throw new NotFoundError(`No published page found with id ${pageId}`);
  }
  
  // Fetch only active sections for the page sorted by order
  const sections = await Section.find({ pageId, isActive: true }).sort('order');
  res.status(StatusCodes.OK).json({ success: true, data: sections });
};

// Get section by ID
const getSectionById = async (req, res) => {
  const { id: sectionId } = req.params;
  
  // Find section by ID
  const section = await Section.findOne({ _id: sectionId });
  if (!section) {
    throw new NotFoundError(`No section found with id ${sectionId}`);
  }
  
  res.status(StatusCodes.OK).json({ success: true, data: section });
};

// Create new section with order calculation
const createSection = async (req, res) => {
  const { type, data, pageId, isActive } = req.body;
  
  // Verify page exists before creating section
  const page = await Page.findOne({ _id: pageId });
  if (!page) {
    throw new NotFoundError(`No page found with id ${pageId}`);
  }
  
  // Get the highest order for sections in this page
  const lastSection = await Section.findOne({ pageId }).sort('-order');
  const order = lastSection ? lastSection.order + 1 : 0;
  
  // Create the section with the user ID from auth middleware
  const section = await Section.create({
    type,
    data,
    pageId,
    order,
    isActive,
    createdBy: req.user.userId
  });
  
  res.status(StatusCodes.CREATED).json({ success: true, data: section });
};

// Update section with page validation
const updateSection = async (req, res) => {
  const { id: sectionId } = req.params;
  const { type, data, pageId, isActive, order } = req.body;
  
  // If pageId is being updated, verify new page exists
  if (pageId) {
    const page = await Page.findOne({ _id: pageId });
    if (!page) {
      throw new NotFoundError(`No page found with id ${pageId}`);
    }
  }
  
  // Build update data object with conditional fields
  const updateData = {
    ...(type && { type }),
    ...(data && { data }),
    ...(pageId && { pageId }),
    ...(isActive !== undefined && { isActive }),
    ...(order !== undefined && { order }),
    updatedBy: req.user.userId
  };
  
  // Update the section
  const section = await Section.findOneAndUpdate(
    { _id: sectionId },
    updateData,
    { new: true, runValidators: true }
  );
  
  if (!section) {
    throw new NotFoundError(`No section found with id ${sectionId}`);
  }
  
  res.status(StatusCodes.OK).json({ success: true, data: section });
};

// Delete section by ID
const deleteSection = async (req, res) => {
  const { id: sectionId } = req.params;
  
  // Find section by ID before deletion
  const section = await Section.findOne({ _id: sectionId });
  if (!section) {
    throw new NotFoundError(`No section found with id ${sectionId}`);
  }
  
  // Delete section document
  await Section.deleteOne({ _id: sectionId });
  
  res.status(StatusCodes.OK).json({ success: true, message: 'Section deleted successfully' });
};

// Update section orders in bulk
const updateSectionOrders = async (req, res) => {
  const { orders } = req.body;
  
  // Validate input format
  if (!Array.isArray(orders)) {
    throw new BadRequestError('Orders must be an array of section ID and order pairs');
  }
  
  // Update each section's order
  const updatePromises = orders.map(({ id, order }) => {
    return Section.updateOne({ _id: id }, { order });
  });
  
  await Promise.all(updatePromises);
  
  res.status(StatusCodes.OK).json({ success: true, message: 'Section orders updated successfully' });
};

module.exports = {
  getAllSections,
  getSectionsByPage,
  getPublishedSectionsByPage,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
  updateSectionOrders
};

// End of sectionController.js
// Description: End of section controller file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 