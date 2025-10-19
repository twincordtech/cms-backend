/*
 * File: blogRoutes.js
 * Description: Express routes for blog CRUD and publishing endpoints in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  publishBlog,
  unpublishBlog
} = require('../controllers/blogController');

// Utility to sanitize string input
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.]/g, '').trim();
};

// Public routes
router.get('/', getBlogs);
router.get('/:id', (req, res, next) => {
  req.params.id = sanitizeString(req.params.id);
  next();
}, getBlog);

// Protected routes
router.use(protect);

// Admin and author routes
router.post('/', authorize('admin', 'author'), (req, res, next) => {
  if (req.body && req.body.slug) req.body.slug = sanitizeString(req.body.slug);
  if (req.body && req.body.title) req.body.title = sanitizeString(req.body.title);
  next();
}, createBlog);
router.put('/:id', authorize('admin', 'author'), (req, res, next) => {
  req.params.id = sanitizeString(req.params.id);
  if (req.body && req.body.slug) req.body.slug = sanitizeString(req.body.slug);
  if (req.body && req.body.title) req.body.title = sanitizeString(req.body.title);
  next();
}, updateBlog);
router.delete('/:id', authorize('admin', 'author'), (req, res, next) => {
  req.params.id = sanitizeString(req.params.id);
  next();
}, deleteBlog);
router.put('/:id/publish', authorize('admin', 'author'), (req, res, next) => {
  req.params.id = sanitizeString(req.params.id);
  next();
}, publishBlog);
router.put('/:id/unpublish', authorize('admin', 'author'), (req, res, next) => {
  req.params.id = sanitizeString(req.params.id);
  next();
}, unpublishBlog);

module.exports = router;

// End of blogRoutes.js
// Description: End of blog routes file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 