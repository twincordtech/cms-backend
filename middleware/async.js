/*
 * File: async.js
 * Description: Utility middleware for handling async operations and error catching in Express routes.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */

// Higher-order function to wrap async route handlers and catch errors
// This eliminates the need for try-catch blocks in every route handler
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;

// End of async.js
// Description: End of async handler utility file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 