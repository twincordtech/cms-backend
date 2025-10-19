/*
 * File: validation.js
 * Description: Custom validation logic for lead data in the CMS application.
 * Design & Developed by: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private Limited
 */

/**
 * Validate lead data for required fields and correct formats.
 * @param {object} data - The lead data to validate.
 * @returns {object} Object containing errors and isValid boolean.
 */
const validateLead = (data) => {
  const errors = {};

  // Validate name (required, non-empty)
  if (!data.name || data.name.trim() === '') {
    errors.name = 'Name is required';
  }

  // Validate email (required, non-empty, valid format)
  if (!data.email || data.email.trim() === '') {
    errors.email = 'Email is required';
  } else {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(data.email)) {
      errors.email = 'Please provide a valid email address';
    }
  }

  // Validate status if provided (must be one of allowed values)
  if (data.status && !['new', 'contacted', 'qualified', 'lost', 'rejected'].includes(data.status)) {
    errors.status = 'Invalid status value';
  }

  // Validate feedback if status is being updated (required)
  if (data.status && (!data.feedback || data.feedback.trim() === '')) {
    errors.feedback = 'Feedback is required when updating status';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

module.exports = {
  validateLead
};

/*
 * End of validation.js
 * Description: End of custom validation logic file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private Limited
 */ 