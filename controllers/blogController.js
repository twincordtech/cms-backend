/*
 * File: blogController.js
 * Description: Handles blog CRUD operations, publishing, and filtering for the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const Blog = require('../models/Blog');
const { validateBlog } = require('../utils/validators');
const { createError } = require('../utils/errorHandler');

// Get all blogs with pagination and filtering
exports.getBlogs = async (req, res, next) => {
  try {
    // Parse pagination and filter parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const search = req.query.search;

    // Build query object for MongoDB
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch blogs with pagination and user population
    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'name email');

    // Get total count for pagination
    const total = await Blog.countDocuments(query);

    // Respond with blogs and pagination info
    res.json({
      success: true,
      data: blogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get a single blog by ID or slug
exports.getBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Find blog by ID or slug
    const blog = await Blog.findOne({
      $or: [
        { _id: id },
        { slug: id }
      ]
    }).populate('createdBy', 'name email');

    if (!blog) {
      throw createError(404, 'Blog not found');
    }

    res.json({
      success: true,
      data: blog
    });
  } catch (error) {
    next(error);
  }
};

// Create a new blog
exports.createBlog = async (req, res, next) => {
  try {
    // Validate blog input
    const { error } = validateBlog(req.body);
    if (error) {
      throw createError(400, error.details[0].message);
    }

    // Create new blog document
    const blog = new Blog({
      ...req.body,
      createdBy: req.user._id,
      publishedAt: req.body.status === 'published' ? new Date() : null
    });

    await blog.save();

    res.status(201).json({
      success: true,
      data: blog
    });
  } catch (error) {
    next(error);
  }
};

// Update a blog
exports.updateBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Validate blog input for update
    const { error } = validateBlog(req.body, true);
    if (error) {
      throw createError(400, error.details[0].message);
    }

    // Find blog by ID
    const blog = await Blog.findById(id);
    if (!blog) {
      throw createError(404, 'Blog not found');
    }

    // Check if user is the creator or an admin
    if (blog.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw createError(403, 'Not authorized to update this blog');
    }

    // If status is changing to published, set publishedAt
    if (req.body.status === 'published' && blog.status !== 'published') {
      req.body.publishedAt = new Date();
    }

    // Update blog document
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedBlog
    });
  } catch (error) {
    next(error);
  }
};

// Publish a blog
exports.publishBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);

    if (!blog) {
      throw createError(404, 'Blog not found');
    }

    // Check if user is the creator or an admin
    if (blog.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw createError(403, 'Not authorized to publish this blog');
    }

    // Set status to published and update publishedAt
    blog.status = 'published';
    blog.publishedAt = new Date();
    await blog.save();

    res.json({
      success: true,
      data: blog
    });
  } catch (error) {
    next(error);
  }
};

// Unpublish a blog
exports.unpublishBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);

    if (!blog) {
      throw createError(404, 'Blog not found');
    }

    // Check if user is the creator or an admin
    if (blog.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw createError(403, 'Not authorized to unpublish this blog');
    }

    // Set status to draft
    blog.status = 'draft';
    await blog.save();

    res.json({
      success: true,
      data: blog
    });
  } catch (error) {
    next(error);
  }
};

// Delete a blog
exports.deleteBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);

    if (!blog) {
      throw createError(404, 'Blog not found');
    }

    // Check if user is the creator or an admin
    if (blog.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw createError(403, 'Not authorized to delete this blog');
    }

    // Delete blog document
    await Blog.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// End of blogController.js
// Description: End of blog controller file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 