/*
 * File: validators.js
 * Description: Joi-based validation logic for blog data in the CMS application.
 * Design & Developed by: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private Limited
 */

const Joi = require('joi');

/**
 * Validate blog data using Joi schema.
 * @param {object} data - The blog data to validate.
 * @param {boolean} isUpdate - If true, makes all fields optional for update operations.
 * @returns {object} Joi validation result.
 */
const validateBlog = (data, isUpdate = false) => {
  // Define the validation schema for blog data
  const schema = Joi.object({
    title: Joi.string().required(),
    content: Joi.string().required(),
    slug: Joi.string().required(),
    status: Joi.string().valid('draft', 'published').default('draft')
  }).unknown(true); // Allow any additional fields

  // For updates, make all fields optional
  if (isUpdate) {
    return schema.fork(
      Object.keys(schema.describe().keys),
      (field) => field.optional()
    ).validate(data);
  }

  return schema.validate(data);
};

module.exports = {
  validateBlog
};

/*
 * End of validators.js
 * Description: End of Joi-based validation logic file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private Limited
 */ 