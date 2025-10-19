/*
 * File: errorHandler.js
 * Description: Custom API error class and global error handling middleware for the CMS application.
 * Design & Developed by: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private Limited
 */

/**
 * Custom error class for API errors.
 * Adds status code, status, and operational flag for trusted errors.
 */
class APIError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Helper to create an APIError instance.
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @returns {APIError}
 */
exports.createError = (statusCode, message) => {
  return new APIError(statusCode, message);
};

/**
 * Global error handling middleware for Express.
 * Handles both operational and programming errors, with different responses for development and production.
 * @param {Error} err - The error object
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next middleware
 */
exports.errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Development error response: show full error details
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      success: false,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } 
  // Production error response: hide sensitive details
  else {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      res.status(err.statusCode).json({
        success: false,
        message: err.message
      });
    }
    // Programming or unknown error: don't leak error details
    else {
      console.error('ERROR 💥', err);
      res.status(500).json({
        success: false,
        message: 'Something went wrong!'
      });
    }
  }
};

/*
 * End of errorHandler.js
 * Description: End of error handler utility file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private Limited
 */ 