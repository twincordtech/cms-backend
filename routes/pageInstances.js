/*
 * File: pageInstances.js
 * Description: Express routes for page instance management in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const express = require('express');
const router = express.Router();
const {
  getPageInstances,
  createPageInstance,
  getPageInstance,
  updatePageInstance,
  deletePageInstance
} = require('../controllers/pageInstanceController');
const { protect } = require('../middleware/auth');

// Utility to sanitize string input
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.]/g, '').trim();
};

// All routes are protected and require authentication
router.use(protect);

// Get all instances for a page
router.get('/:pageId/instances', (req, res, next) => {
  req.params.pageId = sanitizeString(req.params.pageId);
  next();
}, getPageInstances);

// Create a new instance
router.post('/:pageId/instances', (req, res, next) => {
  req.params.pageId = sanitizeString(req.params.pageId);
  next();
}, createPageInstance);

// Get a single instance
router.get('/:pageId/instances/:id', (req, res, next) => {
  req.params.pageId = sanitizeString(req.params.pageId);
  req.params.id = sanitizeString(req.params.id);
  next();
}, getPageInstance);

// Update an instance
router.put('/:pageId/instances/:id', (req, res, next) => {
  req.params.pageId = sanitizeString(req.params.pageId);
  req.params.id = sanitizeString(req.params.id);
  next();
}, updatePageInstance);

// Delete an instance
router.delete('/:pageId/instances/:id', (req, res, next) => {
  req.params.pageId = sanitizeString(req.params.pageId);
  req.params.id = sanitizeString(req.params.id);
  next();
}, deletePageInstance);

module.exports = router;

// End of pageInstances.js
// Description: End of page instance routes file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 