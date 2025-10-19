/*
 * File: pageController.js
 * Description: Handles CRUD operations, page management, and content organization for the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const Page = require('../models/Page');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

// Get all pages with layout population and sorting
const getAllPages = async (req, res) => {
  // Fetch all pages with layout population and sort by order
  const pages = await Page.find({})
    .populate('layout')
    .sort('order');

  // Respond with formatted page data
  res.status(StatusCodes.OK).json({
    success: true,
    count: pages.length,
    pages: pages.map(page => ({
      _id: page._id,
      title: page.title,
      slug: page.slug,
      status: page.status,
      isActive: page.isActive,
      isMultiPage: page.isMultiPage,
      apiEndpoint: page.apiEndpoint,
      layout: page.layout,
      order: page.order,
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      metadata: page.metadata,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt
    }))
  });
};

// Get published pages for public access
const getPublishedPages = async (req, res) => {
  // Fetch only published and active pages
  const pages = await Page.find({ 
    status: 'published',
    isActive: true 
  }).sort('order');
  
  res.status(StatusCodes.OK).json({ success: true, data: pages });
};

// Get single page by ID with layout and component population
const getSinglePage = async (req, res) => {
  const { id: pageId } = req.params;

  // Find page by ID with nested population
  const page = await Page.findOne({ _id: pageId }).populate({
    path: 'layout',
    populate: {
      path: 'components'
    }
  });

  if (!page) {
    throw new CustomError.NotFoundError(`No page with id: ${pageId}`);
  }

  // Respond with formatted page data
  res.status(StatusCodes.OK).json({
    success: true,
    page: {
      _id: page._id,
      title: page.title,
      slug: page.slug,
      status: page.status,
      isActive: page.isActive,
      isMultiPage: page.isMultiPage,
      apiEndpoint: page.apiEndpoint,
      layout: page.layout,
      order: page.order,
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      metadata: page.metadata,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt
    }
  });
};

// Get page by slug for public access
const getPageBySlug = async (req, res) => {
  const { slug } = req.params;
  
  // Find published and active page by slug
  const page = await Page.findOne({ 
    slug, 
    status: 'published',
    isActive: true 
  });
  
  if (!page) {
    throw new CustomError.NotFoundError(`No published page found with slug ${slug}`);
  }
  
  res.status(StatusCodes.OK).json({ success: true, data: page });
};

// Create new page with validation
const createPage = async (req, res) => {
  const { 
    title, 
    slug, 
    status = 'draft',
    isActive = true,
    isMultiPage = false,
    layout,
    metadata = {},
    metaTitle = '',
    metaDescription = ''
  } = req.body;

  // Check if page with slug already exists
  const existingPage = await Page.findOne({ slug });
  if (existingPage) {
    throw new CustomError.BadRequestError('Page with this slug already exists');
  }

  // Create new page document
  const newPage = await Page.create({
    title,
    slug,
    status,
    isActive,
    isMultiPage,
    layout,
    metadata,
    metaTitle,
    metaDescription
  });
  
  // Respond with formatted page data
  res.status(StatusCodes.CREATED).json({
    success: true,
    page: {
      _id: newPage._id,
      title: newPage.title,
      slug: newPage.slug,
      status: newPage.status,
      isActive: newPage.isActive,
      isMultiPage: newPage.isMultiPage,
      apiEndpoint: newPage.apiEndpoint,
      metaTitle: newPage.metaTitle,
      metaDescription: newPage.metaDescription,
      metadata: newPage.metadata,
      createdAt: newPage.createdAt
    }
  });
};

// Update page with validation and API endpoint handling
const updatePage = async (req, res) => {
  const { id: pageId } = req.params;
  const updateData = { ...req.body };

  // Ensure isActive is properly handled as a boolean
  if (typeof updateData.isActive === 'boolean') {
    updateData.isActive = updateData.isActive;
  }

  // Update page document
  const updatedPage = await Page.findOneAndUpdate(
    { _id: pageId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!updatedPage) {
    throw new CustomError.NotFoundError(`No page with id: ${pageId}`);
  }

  // Update apiEndpoint if slug changed
  if (updateData.slug && updateData.slug !== updatedPage.slug) {
    updatedPage.apiEndpoint = `/api/cms/pages/${updateData.slug}/content`;
    await updatedPage.save();
  }

  // Respond with formatted page data
  res.status(StatusCodes.OK).json({
    success: true,
    page: {
      _id: updatedPage._id,
      title: updatedPage.title,
      slug: updatedPage.slug,
      status: updatedPage.status,
      isActive: updatedPage.isActive,
      isMultiPage: updatedPage.isMultiPage,
      apiEndpoint: updatedPage.apiEndpoint,
      layout: updatedPage.layout,
      order: updatedPage.order,
      metaTitle: updatedPage.metaTitle,
      metaDescription: updatedPage.metaDescription,
      metadata: updatedPage.metadata,
      updatedAt: updatedPage.updatedAt
    }
  });
};

// Delete page by ID
const deletePage = async (req, res) => {
  const { id: pageId } = req.params;

  // Find page by ID
  const page = await Page.findOne({ _id: pageId });

  if (!page) {
    throw new CustomError.NotFoundError(`No page with id: ${pageId}`);
  }

  // Remove page document
      await page.deleteOne();

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Page successfully deleted'
  });
};

// Update page orders in bulk
const updatePageOrders = async (req, res) => {
  const { pages } = req.body;

  // Validate input
  if (!Array.isArray(pages)) {
    throw new CustomError.BadRequestError('Pages must be an array');
  }

  // Update each page's order
  const updatePromises = pages.map(({ _id, order }) => 
    Page.findByIdAndUpdate(_id, { order }, { new: true })
  );

  await Promise.all(updatePromises);

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Page orders updated successfully'
  });
};

module.exports = {
  getAllPages,
  getPublishedPages,
  getSinglePage,
  getPageBySlug,
  createPage,
  updatePage,
  deletePage,
  updatePageOrders,
};

// End of pageController.js
// Description: End of page controller file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 