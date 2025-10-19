/*
 * File: formsController.js
 * Description: Handles CRUD operations and submissions for forms and form responses in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const Form = require('../models/Form');
const FormResponse = require('../models/FormResponse');
const mongoose = require('mongoose');
const multer = require('multer');
const upload = multer({ dest: 'uploads/media/' });

// Test handler (optional)
exports.test = (req, res) => {
  res.json({ message: 'Forms controller is working' });
};

// Create a new form (POST /)
exports.createForm = async (req, res, next) => {
  try {
    // Extract form data from request body
    const { name, title, description, fields, type } = req.body;
    // Create new form document
    const form = new Form({
      name,
      title,
      description,
      type: type || 'custom',
      fields,
      createdBy: req.user ? req.user._id : undefined
    });
    await form.save();
    res.status(201).json({ success: true, data: form });
  } catch (error) {
    next(error);
  }
};

// Get all forms (GET /)
exports.getAllForms = async (req, res, next) => {
  try {
    // Fetch all forms sorted by creation date
    const forms = await Form.find().sort({ createdAt: -1 });
    res.json({ success: true, data: forms });
  } catch (error) {
    next(error);
  }
};

// Get form by ID (GET /:formId)
exports.getForm = async (req, res, next) => {
  try {
    const { formId } = req.params;
    // Find form by ID
    const form = await Form.findById(formId);
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });
    res.json({ success: true, data: form });
  } catch (error) {
    next(error);
  }
};

// Update form by ID (PUT /:formId)
exports.updateForm = async (req, res, next) => {
  try {
    const { formId } = req.params;
    const update = req.body;
    if (update.type === undefined) update.type = 'custom';
    // Update form document
    const form = await Form.findByIdAndUpdate(formId, update, { new: true, runValidators: true });
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });
    res.json({ success: true, data: form });
  } catch (error) {
    next(error);
  }
};

// Submit a form response (POST /:formId/submit)
exports.submitFormResponse = [
  upload.any(),
  async (req, res, next) => {
    try {
      const { formId } = req.params;
      // Find form by ID
      const form = await Form.findById(formId);
      if (!form) return res.status(404).json({ success: false, message: 'Form not found' });
      // Build response object from request body
      const response = { ...req.body };
      // Attach files if any
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          response[file.fieldname] = {
            originalname: file.originalname,
            filename: file.filename,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size
          };
        });
      }
      // Validate required fields
      for (const field of form.fields) {
        if (field.required && (response[field.name] === undefined || response[field.name] === '')) {
          return res.status(400).json({ success: false, message: `Field '${field.label}' is required.` });
        }
      }
      // Create new form response document
      const formResponse = new FormResponse({
        form: formId,
        response,
        submittedBy: req.user ? req.user._id : undefined
      });
      await formResponse.save();
      res.status(201).json({ success: true, data: formResponse });
    } catch (error) {
      next(error);
    }
  }
];

// Delete a form by ID (DELETE /:formId)
exports.deleteForm = async (req, res, next) => {
  try {
    const { formId } = req.params;
    // Delete form document by ID
    const form = await Form.findByIdAndDelete(formId);
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });
    res.json({ success: true, message: 'Form deleted' });
  } catch (error) {
    next(error);
  }
};

// End of formsController.js
// Description: End of forms controller file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 