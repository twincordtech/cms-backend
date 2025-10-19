/*
 * File: sectionRoutes.js
 * Description: Express routes for section management in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const express = require('express');
const router = express.Router();
const {
  getAllSections,
  getSectionsByPage,
  getPublishedSectionsByPage,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
  updateSectionOrders
} = require('../controllers/sectionController');

const { authenticateUser, authorizePermissions } = require('../middleware/authentication');

// Utility to sanitize string input
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.]/g, '').trim();
};

// Public routes
router.get('/published/page/:pageId', getPublishedSectionsByPage);

// Admin routes
router.route('/')
  .get(authenticateUser, authorizePermissions('admin'), getAllSections)
  .post(authenticateUser, authorizePermissions('admin'), createSection);

router.route('/:id')
  .get(authenticateUser, authorizePermissions('admin'), getSectionById)
  .put(authenticateUser, authorizePermissions('admin'), updateSection)
  .delete(authenticateUser, authorizePermissions('admin'), deleteSection);

router.get('/page/:pageId', authenticateUser, authorizePermissions('admin'), getSectionsByPage);
router.put('/orders', authenticateUser, authorizePermissions('admin'), updateSectionOrders);

module.exports = router;

// End of sectionRoutes.js
// Description: End of section routes file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 