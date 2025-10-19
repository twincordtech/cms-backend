/*
 * File: leads.js
 * Description: Express routes for lead management in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const express = require('express');
const router = express.Router();
const { protect, authorizeAdmin } = require('../middleware/auth');
const leadController = require('../controllers/leadController');

// Utility to sanitize string input
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.]/g, '').trim();
};

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Leads route is working' });
});

// Public route to create a lead
router.post('/', (req, res, next) => {
  if (req.body && req.body.email) req.body.email = sanitizeString(req.body.email);
  next();
}, leadController.createLead);

// Get all leads - making it public temporarily for testing
router.get('/', protect, leadController.getLeads);
router.get('/all', protect, leadController.getAllLeads);

// Update lead status
router.put('/:leadId/status', protect, (req, res, next) => {
  req.params.leadId = sanitizeString(req.params.leadId);
  next();
}, leadController.updateLeadStatus);

// Delete lead
router.delete('/:leadId', protect, (req, res, next) => {
  req.params.leadId = sanitizeString(req.params.leadId);
  next();
}, leadController.deleteLead);

// Get lead history
router.get('/:leadId/history', protect, (req, res, next) => {
  req.params.leadId = sanitizeString(req.params.leadId);
  next();
}, leadController.getLeadHistory);

// Schedule meeting
router.post('/:leadId/schedule-meeting', protect, (req, res, next) => {
  req.params.leadId = sanitizeString(req.params.leadId);
  next();
}, leadController.scheduleMeeting);

module.exports = router;

// End of leads.js
// Description: End of leads routes file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 