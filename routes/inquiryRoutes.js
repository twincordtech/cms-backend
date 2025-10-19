/*
 * File: inquiryRoutes.js
 * Description: Express routes for inquiry management in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const express = require('express');
const router = express.Router();
const inquiryController = require('../controllers/inquiryController');
const { protect } = require('../middleware/authMiddleware');

// Utility to sanitize string input
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.]/g, '').trim();
};

// Public route to create an inquiry
router.post('/', (req, res, next) => {
  if (req.body && req.body.email) req.body.email = sanitizeString(req.body.email);
  next();
}, inquiryController.createInquiry);

// Admin/protected routes
router.get('/', protect, inquiryController.getInquiries);
router.get('/:inquiryId', protect, (req, res, next) => {
  req.params.inquiryId = sanitizeString(req.params.inquiryId);
  next();
}, inquiryController.getInquiry);
router.put('/:inquiryId/status', protect, (req, res, next) => {
  req.params.inquiryId = sanitizeString(req.params.inquiryId);
  next();
}, inquiryController.updateInquiryStatus);
router.delete('/:inquiryId', protect, (req, res, next) => {
  req.params.inquiryId = sanitizeString(req.params.inquiryId);
  next();
}, inquiryController.deleteInquiry);
router.post('/:inquiryId/schedule-meeting', protect, (req, res, next) => {
  req.params.inquiryId = sanitizeString(req.params.inquiryId);
  next();
}, inquiryController.scheduleInquiryMeeting);

module.exports = router;

// End of inquiryRoutes.js
// Description: End of inquiry routes file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 