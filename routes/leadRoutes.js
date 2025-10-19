/*
 * File: leadRoutes.js
 * Description: Express routes for lead management in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const leadController = require('../controllers/leadController');

// Utility to sanitize string input
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.]/g, '').trim();
};

// Debug middleware for lead routes
router.use((req, res, next) => {
  // Remove or comment out debug logs for production
  next();
});

// Schedule meeting - place this route before other parameterized routes
router.post('/:leadId/schedule-meeting', auth, (req, res, next) => {
  req.params.leadId = sanitizeString(req.params.leadId);
  next();
}, (req, res, next) => {
  leadController.scheduleMeeting(req, res, next);
});

// GET all leads
router.get('/', auth, leadController.getLeads);

// GET all leads
router.get('/all', auth, leadController.getAllLeads);

// Create new lead
router.post('/', (req, res, next) => {
  if (req.body && req.body.email) req.body.email = sanitizeString(req.body.email);
  next();
}, leadController.createLead);

// Get lead history
router.get('/:leadId/history', auth, (req, res, next) => {
  req.params.leadId = sanitizeString(req.params.leadId);
  next();
}, leadController.getLeadHistory);

// Update lead status
router.put('/:leadId/status', auth, (req, res, next) => {
  req.params.leadId = sanitizeString(req.params.leadId);
  next();
}, leadController.updateLeadStatus);

// Update lead feedback
router.put('/:leadId/feedback', auth, (req, res, next) => {
  req.params.leadId = sanitizeString(req.params.leadId);
  next();
}, leadController.updateLeadFeedback);

// Delete lead
router.delete('/:leadId', auth, (req, res, next) => {
  req.params.leadId = sanitizeString(req.params.leadId);
  next();
}, leadController.deleteLead);

// Get single lead
router.get('/:leadId', auth, (req, res, next) => {
  req.params.leadId = sanitizeString(req.params.leadId);
  next();
}, leadController.getLead);

module.exports = router;

// End of leadRoutes.js
// Description: End of lead routes file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 