/*
 * File: jwtUtils.js
 * Description: Utility functions for generating and verifying JWT and refresh tokens for authentication in the CMS application.
 * Design & Developed by: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private Limited
 */

const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for a given user ID.
 * @param {string} id - User ID to encode in the token.
 * @returns {string} JWT token.
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '24h'
  });
};

/**
 * Verify a JWT token and return the decoded payload if valid.
 * @param {string} token - JWT token to verify.
 * @returns {object|null} Decoded payload or null if invalid.
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Generate a random token (for email verification or password reset).
 * @returns {string} Random token string.
 */
const generateRandomToken = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * Generate a refresh token with a longer expiry for a given user ID.
 * @param {string} userId - User ID to encode in the refresh token.
 * @returns {string} Refresh JWT token.
 * @throws {Error} If JWT_REFRESH_SECRET is not defined.
 */
const generateRefreshToken = (userId) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
};

/**
 * Generate an access token with a shorter expiry for a given user ID.
 * @param {string} userId - User ID to encode in the access token.
 * @returns {string} Access JWT token.
 * @throws {Error} If JWT_SECRET is not defined.
 */
const generateAccessToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '15m' }
  );
};

/**
 * Verify a refresh token and return the decoded payload if valid.
 * @param {string} token - Refresh JWT token to verify.
 * @returns {object|null} Decoded payload or null if invalid.
 * @throws {Error} If JWT_REFRESH_SECRET is not defined.
 */
const verifyRefreshToken = (token) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Verify an access token and return the decoded payload if valid.
 * @param {string} token - Access JWT token to verify.
 * @returns {object|null} Decoded payload or null if invalid.
 * @throws {Error} If JWT_SECRET is not defined.
 */
const verifyAccessToken = (token) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  generateRandomToken,
  generateRefreshToken,
  generateAccessToken,
  verifyRefreshToken,
  verifyAccessToken
};

/*
 * End of jwtUtils.js
 * Description: End of JWT utility file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private Limited
 */ 