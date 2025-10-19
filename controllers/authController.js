/*
 * File: authController.js
 * Description: Handles user authentication, registration, login, logout, and token refresh logic for the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwtUtils');
const { setRefreshTokenCookie } = require('../utils/cookieUtils');

// ... existing code ...

// Refresh the user's authentication token
const refreshToken = async (req, res) => {
  try {
    const user = req.user;
    
    // Generate new access and refresh tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Update user's refresh token in the database
    user.refreshToken = refreshToken;
    await user.save();
    
    // Set the new refresh token as a cookie
    setRefreshTokenCookie(res, refreshToken);
    
    // Respond with new tokens and user info
    res.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user._id,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    // Handle errors during token refresh
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token'
    });
  }
};

module.exports = {
  register, // Handles user registration
  login,    // Handles user login
  logout,   // Handles user logout
  refreshToken // Handles token refresh
};

// End of authController.js
// Description: End of authentication controller file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 