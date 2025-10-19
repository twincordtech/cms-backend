/*
 * File: auth.js
 * Description: Authentication middleware for JWT token verification, refresh token handling, and role-based authorization.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyAccessToken, verifyRefreshToken } = require('../utils/jwtUtils');

// Middleware to protect routes by verifying JWT access tokens
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from cookies first (preferred method)
    if (req.cookies.token) {
      token = req.cookies.token;
    }
    // Get token from Authorization header as fallback
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized to access this route' 
      });
    }

    // Verify access token
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      // If access token is invalid, check if we have a refresh token
      const refreshToken = req.cookies.refreshToken || req.headers['x-refresh-token'];
      if (refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Access token expired',
          shouldRefresh: true
        });
      }
      return res.status(401).json({ 
        success: false,
        message: 'Token is not valid or has expired' 
      });
    }

    // Find user by decoded token ID
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    next();
  } catch (error) {
    // Handle authentication errors
    return res.status(401).json({ 
      success: false,
      message: 'Not authorized to access this route' 
    });
  }
};

// Middleware to validate refresh tokens for token renewal
const validateRefreshToken = async (req, res, next) => {
  try {
    // Get refresh token from cookies or headers
    const refreshToken = req.cookies.refreshToken || req.headers['x-refresh-token'];
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is invalid or has expired'
      });
    }

    // Find user by decoded token ID
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if the stored refresh token matches the provided one
    if (user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token mismatch'
      });
    }

    // Check if refresh token has expired
    if (user.refreshTokenExpires < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired',
        shouldLogin: true
      });
    }

    req.user = user;
    next();
  } catch (error) {
    // Handle refresh token validation errors
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

// Middleware factory for role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists and has required role
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: `User role ${req.user?.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Legacy middleware for admin authorization (use authorize('admin') instead)
const authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to access this route' });
  }
  next();
};

module.exports = {
  protect,
  authorize,
  authorizeAdmin,
  validateRefreshToken
}; 

// End of auth.js
// Description: End of authentication middleware file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 