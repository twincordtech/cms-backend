/*
 * File: blog.js
 * Description: Express routes for blog management and public blog endpoints in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const { protect, authorizeAdmin } = require('../middleware/authMiddleware');

// Utility to sanitize string input
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.]/g, '').trim();
};

// @desc    Get all published blogs
// @route   GET /api/cms/blogs
// @access  Public
router.get('/blogs', async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published' })
      .sort('-publishedAt')
      .select('-content')
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get all blogs (including drafts) - admin only
// @route   GET /api/cms/admin/blogs
// @access  Private/Admin
router.get('/admin/blogs', protect, authorizeAdmin, async (req, res) => {
  try {
    const blogs = await Blog.find()
      .sort('-createdAt')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get single blog by ID - admin only
// @route   GET /api/cms/admin/blogs/:id
// @access  Private/Admin
router.get('/admin/blogs/:id', protect, authorizeAdmin, async (req, res) => {
  try {
    const blogId = sanitizeString(req.params.id);
    const blog = await Blog.findById(blogId)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get single blog by slug
// @route   GET /api/cms/blogs/:slug
// @access  Public
router.get('/blogs/:slug', async (req, res) => {
  try {
    const slug = sanitizeString(req.params.slug);
    const blog = await Blog.findOne({ 
      slug,
      status: 'published'
    }).populate('createdBy', 'name email');

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Increment views
    blog.views += 1;
    await blog.save();

    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Create new blog
// @route   POST /api/cms/admin/blogs
// @access  Private/Admin
router.post('/admin/blogs', protect, authorizeAdmin, async (req, res) => {
  try {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.slug) sanitizedBody.slug = sanitizeString(sanitizedBody.slug);
    if (sanitizedBody.title) sanitizedBody.title = sanitizeString(sanitizedBody.title);
    if (sanitizedBody.status) sanitizedBody.status = sanitizeString(sanitizedBody.status);
    sanitizedBody.createdBy = req.user._id;
    sanitizedBody.updatedBy = req.user._id;

    const blog = await Blog.create(sanitizedBody);

    res.status(201).json({
      success: true,
      data: blog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update blog
// @route   PUT /api/cms/admin/blogs/:id
// @access  Private/Admin
router.put('/admin/blogs/:id', protect, authorizeAdmin, async (req, res) => {
  try {
    const blogId = sanitizeString(req.params.id);
    let blog = await Blog.findById(blogId);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    const sanitizedBody = { ...req.body };
    if (sanitizedBody.slug) sanitizedBody.slug = sanitizeString(sanitizedBody.slug);
    if (sanitizedBody.title) sanitizedBody.title = sanitizeString(sanitizedBody.title);
    if (sanitizedBody.status) sanitizedBody.status = sanitizeString(sanitizedBody.status);
    sanitizedBody.updatedBy = req.user._id;

    blog = await Blog.findByIdAndUpdate(
      blogId,
      sanitizedBody,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Delete blog
// @route   DELETE /api/cms/admin/blogs/:id
// @access  Private/Admin
router.delete('/admin/blogs/:id', protect, authorizeAdmin, async (req, res) => {
  try {
    const blogId = sanitizeString(req.params.id);
    const blog = await Blog.findById(blogId);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    await blog.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Publish blog
// @route   PUT /api/cms/admin/blogs/:id/publish
// @access  Private/Admin
router.put('/admin/blogs/:id/publish', protect, authorizeAdmin, async (req, res) => {
  try {
    const blogId = sanitizeString(req.params.id);
    const blog = await Blog.findById(blogId);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    blog.status = 'published';
    blog.publishedAt = Date.now();
    blog.updatedBy = req.user._id;
    await blog.save();

    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Unpublish blog
// @route   PUT /api/cms/admin/blogs/:id/unpublish
// @access  Private/Admin
router.put('/admin/blogs/:id/unpublish', protect, authorizeAdmin, async (req, res) => {
  try {
    const blogId = sanitizeString(req.params.id);
    const blog = await Blog.findById(blogId);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    blog.status = 'draft';
    blog.updatedBy = req.user._id;
    await blog.save();

    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get blog stats
// @route   GET /api/cms/blogs/stats
// @access  Private/Admin
router.get('/blogs/stats', protect, authorizeAdmin, async (req, res) => {
  try {
    const total = await Blog.countDocuments();
    const published = await Blog.countDocuments({ status: 'published' });
    const drafts = await Blog.countDocuments({ status: 'draft' });
    const totalViews = await Blog.aggregate([
      { $group: { _id: null, views: { $sum: '$views' } } }
    ]);
    const totalLikes = await Blog.aggregate([
      { $group: { _id: null, likes: { $sum: '$likes' } } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total,
        published,
        drafts,
        views: totalViews[0]?.views || 0,
        likes: totalLikes[0]?.likes || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get recent blogs
// @route   GET /api/cms/blogs/recent
// @access  Private/Admin
router.get('/blogs/recent', protect, authorizeAdmin, async (req, res) => {
  try {
    const blogs = await Blog.find()
      .sort('-createdAt')
      .limit(5)
      .select('title slug status createdAt views likes')
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      data: blogs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Search blogs
// @route   GET /api/cms/blogs/search
// @access  Public
router.get('/blogs/search', async (req, res) => {
  try {
    const query = sanitizeString(req.query.query);
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query'
      });
    }
    const blogs = await Blog.find({
      $and: [
        { status: 'published' },
        {
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { content: { $regex: query, $options: 'i' } },
            { 'author.name': { $regex: query, $options: 'i' } },
            { categories: { $regex: query, $options: 'i' } },
            { tags: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .select('-content')
    .sort('-publishedAt');

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

// End of blog.js
// Description: End of blog routes file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 