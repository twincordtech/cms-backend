/*
 * File: auth.js
 * Description: Express routes for authentication, user management, and security in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken, generateRandomToken, generateRefreshToken, verifyRefreshToken, generateAccessToken } = require('../utils/jwtUtils');
const { sendVerificationEmail, sendPasswordResetEmail, sendEmail } = require('../utils/emailUtils');
const { protect, authorizeAdmin } = require('../middleware/authMiddleware');
const router = express.Router();
const crypto = require('crypto');
const process = require('process');

// Utility to sanitize string input
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.]/g, '').trim();
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    let { name, email, mobile, password } = req.body;
    name = sanitizeString(name);
    email = sanitizeString(email);
    mobile = sanitizeString(mobile);
    
    // Validate required fields
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, mobile, password)'
      });
    }
    
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }
    
    // Create user with password (it will be hashed by the User model pre-save hook)
    const user = await User.create({
      name,
      email,
      mobile,
      password,
      role: 'admin', // Set role as admin
      isVerified: true, // Auto-verify users
      isActive: true
    });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully. You can now login.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error registering user'
    });
  }
});

// @desc    Verify email and set password
// @route   POST /api/auth/set-password/:token
// @access  Public
router.post('/set-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }
    
    // Find user by either verification token or password reset token
    const user = await User.findOne({
      $or: [
        {
          verificationToken: token,
          tokenExpiry: { $gt: Date.now() }
        },
        {
      passwordResetToken: token,
          passwordResetExpiry: { $gt: Date.now() }
        }
      ]
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Update user
    user.passwordHash = passwordHash;
    user.isVerified = true;
    user.verificationToken = undefined;
    user.tokenExpiry = undefined;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    
    await user.save();
    
    // Generate tokens
    const refreshToken = generateRefreshToken(user._id);
    const accessToken = generateAccessToken(user._id);
    
    // Set cookies
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    
    res.status(200).json({
      success: true,
      message: 'Password set successfully',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Set Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting password'
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    // Find user
    const user = await User.findOne({ email });
    
    // Check if user exists and password matches
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email to login'
      });
    }
    
    // Generate JWT
    const token = generateToken(user._id);
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in'
    });
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    // Clear refresh token
    req.user.refreshToken = undefined;
    req.user.refreshTokenExpires = undefined;
    await req.user.save();
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out'
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
});

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }
    
    // Find user
    const user = await User.findOne({ email });
    
    // Even if user doesn't exist, send success message for security
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });
    }
    
    // Generate reset token
    const resetToken = generateRandomToken();
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    
    // Update user
    user.passwordResetToken = resetToken;
    user.passwordResetExpiry = resetExpiry;
    
    await user.save();
    
    // Send reset email
    await sendPasswordResetEmail(email, resetToken);
    
    res.status(200).json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link'
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request'
    });
  }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }
    
    // Find user
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpiry: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Update user
    user.passwordHash = passwordHash;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
});

// @desc    Update user password
// @route   PUT /api/auth/profile/password
// @access  Private
router.put('/profile/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }
    
    // Find user
    const user = await User.findById(req.user._id);
    
    // Check if current password is correct
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Update user
    user.passwordHash = passwordHash;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password'
    });
  }
});

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
router.get('/users', protect, authorizeAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-passwordHash -verificationToken -tokenExpiry')
      .sort({ createdAt: -1 });
    
    // Transform the data to include all fields with proper defaults
    const transformedUsers = users.map(user => ({
      _id: user._id,
      name: user.name || '',
      email: user.email || '',
      mobile: user.mobile || '',
      role: user.role || 'viewer',
      company: user.company || '',
      designation: user.designation || '',
      department: user.department || '',
      isActive: user.isActive !== undefined ? user.isActive : true,
      isVerified: user.isVerified !== undefined ? user.isVerified : false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    res.status(200).json({ 
      success: true,
      count: transformedUsers.length,
      users: transformedUsers
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching users' 
    });
  }
});

// @desc    Update user
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
router.put('/users/:id', protect, authorizeAdmin, async (req, res) => {
  try {
    const { name, mobile, role, company, designation, department, isActive } = req.body;

    // Find user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Update user with sanitized data
    user.name = name.trim();
    user.mobile = mobile.trim();
    user.role = role;
    user.company = company?.trim() || '';
    user.designation = designation?.trim() || '';
    user.department = department?.trim() || '';
      user.isActive = isActive;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        company: user.company,
        designation: user.designation,
        department: user.department,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating user' 
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
router.delete('/users/:id', protect, authorizeAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false,
        message: 'You cannot delete your own account' 
      });
    }

    await user.deleteOne();

    res.status(200).json({ 
      success: true,
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting user' 
    });
  }
});

// @desc    Register a new user by admin
// @route   POST /api/auth/register-user
// @access  Private/Admin
router.post('/register-user', protect, authorizeAdmin, async (req, res) => {
  try {
    const { name, email, mobile, role, company, designation, department } = req.body;

    // Validate required fields
    if (!name || !email || !mobile || !role) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide all required fields' 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already registered' 
      });
    }

    // Generate a random token for password setup
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user with sanitized data and ensure all fields are saved
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
      role,
      company: company ? company.trim() : '',
      designation: designation ? designation.trim() : '',
      department: department ? department.trim() : '',
      verificationToken,
      tokenExpiry,
      isActive: true,
      isVerified: false
    });

    // Send password setup email
    const setupUrl = `${process.env.CLIENT_URL}/set-password/${verificationToken}`;
    
    const emailContent = `
      <h1>Welcome to CMS</h1>
      <p>Hello ${name},</p>
      <p>An account has been created for you. Please click the link below to set up your password:</p>
      <a href="${setupUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Set Up Password</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    // Try to send email, but don't fail registration if email fails
    try {
      await sendEmail({
        to: email,
        subject: 'Set Up Your CMS Account',
        html: emailContent
      });
    } catch (emailError) {
      console.error('Email sending failed (non-critical):', emailError.message);
      // Continue with registration even if email fails
    }

    // Return the created user data in the response
    res.status(201).json({ 
      success: true,
      message: 'User registered successfully. Password setup email sent.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        company: user.company,
        designation: user.designation,
        department: user.department,
        isActive: user.isActive,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user'
    });
  }
});

// @desc    Check user credentials
// @route   POST /api/auth/check-credentials
// @access  Public
router.post('/check-credentials', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    // Find user
    const user = await User.findOne({ email });
    
    // Check if user exists and password matches
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email to login'
      });
    }
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Check Credentials Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking credentials'
    });
  }
});

// @desc    Generate refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
router.post('/refresh-token', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Generate refresh token
    const refreshToken = generateRefreshToken(userId);
    const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Update user with refresh token
    user.refreshToken = refreshToken;
    user.refreshTokenExpires = refreshTokenExpires;
    await user.save();
    
    res.status(200).json({
      success: true,
      refreshToken
    });
  } catch (error) {
    console.error('Generate Refresh Token Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating refresh token'
    });
  }
});

// @desc    Generate access token
// @route   POST /api/auth/access-token
// @access  Public
router.post('/access-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }
    
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
    
    // Find user and verify stored refresh token
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken || user.refreshTokenExpires < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
    
    // Generate new access token
    const accessToken = generateAccessToken(decoded.id);
    
    res.status(200).json({
      success: true,
      accessToken
    });
  } catch (error) {
    console.error('Generate Access Token Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error generating access token'
    });
  }
});

// @desc    Get all authors (users)
// @route   GET /api/auth/authors
// @access  Private/Admin
router.get('/authors', protect, authorizeAdmin, async (req, res) => {
  try {
    const authors = await User.find({ role: 'user' }).select('name email role');
    res.status(200).json({ success: true, data: authors });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching authors' });
  }
});

// @desc    Create a new author
// @route   POST /api/auth/authors
// @access  Private/Admin
router.post('/authors', protect, authorizeAdmin, async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Author with this email already exists' });
    }
    const author = await User.create({ name, email, role: 'user', isVerified: true });
    res.status(201).json({ success: true, data: { id: author._id, name: author.name, email: author.email, role: author.role } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating author' });
  }
});

module.exports = router;

// End of auth.js
// Description: End of authentication routes file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 