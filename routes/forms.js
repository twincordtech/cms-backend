/*
 * File: forms.js
 * Description: Express routes for form CRUD and submission in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const express = require('express');
const router = express.Router();
const formsController = require('../controllers/formsController');

// Utility to sanitize string input
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.]/g, '').trim();
};

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Forms route is working' });
});

/**
 * @desc    Get all forms
 * @route   GET /api/forms
 * @access  Public
 */
router.get('/', formsController.getAllForms);

/**
 * @desc    Create a new form
 * @route   POST /api/forms/create
 * @access  Public
 */
router.post('/', formsController.createForm);

/**
 * @desc    Get form by ID
 * @route   GET /api/forms/:formId
 * @access  Public
 */
router.get('/:formId', formsController.getForm);

/**
 * @desc    Update form by ID
 * @route   PUT /api/forms/update/:formId
 * @access  Public
 */
router.put('/:formId', formsController.updateForm);

/**
 * @desc    Submit a form response
 * @route   POST /api/forms/submit/:formId
 * @access  Public
 */
router.post('/:formId/submit', formsController.submitFormResponse);

/**
 * @desc    Delete a form by ID
 * @route   DELETE /api/forms/:formId
 * @access  Public
 */
router.delete('/:formId', formsController.deleteForm);

module.exports = router;

// End of forms.js
// Description: End of forms routes file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 