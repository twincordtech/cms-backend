/*
 * File: authMiddleware.js
 * Description: Alternative authentication middleware for JWT token verification and admin authorization.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('../utils/jwtUtils');
const process = require('process');

// Middleware to protect routes by verifying JWT tokens
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from cookies or authorization header
    if (req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    // Verify token using utility function
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid or has expired'
      });
    }
    
    // Find user by decoded token ID, excluding sensitive fields
    const user = await User.findById(decoded.id).select('-passwordHash -passwordResetToken -passwordResetExpires');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Set user in request object for downstream middleware/routes
    req.user = user;
    next();
  } catch (error) {
    // Handle authentication errors
    // console.error('Auth Middleware Error:', error); // Removed for production cleanliness
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Middleware to authorize admin-only routes
const authorizeAdmin = async (req, res, next) => {
  try {
    // Check if user exists and has admin role
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    next();
  } catch (error) {
    // Handle admin authorization errors
    // console.error('Admin Auth Middleware Error:', error); // Removed for production cleanliness
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

module.exports = {
  protect,
  authorizeAdmin
};

// End of authMiddleware.js
// Description: End of authentication middleware file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 