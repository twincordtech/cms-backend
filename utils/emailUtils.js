/*
 * File: emailUtils.js
 * Description: Utility functions for sending emails (generic, verification, password reset) using nodemailer in the CMS application.
 * Design & Developed by: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private Limited
 */

const nodemailer = require('nodemailer');

/**
 * Create and return a nodemailer transporter using environment variables.
 * Uses secure connection for port 465 with SSL certificate handling.
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465, // true only for port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    // Handle SSL certificate issues
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates
      minVersion: 'TLSv1.2'
    },
    // Add connection timeout
    connectionTimeout: 10000,
    // Add debug logging in development
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  });
};

/**
 * Send a generic email.
 * @param {Object} params - Email details
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.html - Email HTML content
 */
const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html
  };
  await transporter.sendMail(mailOptions);
};

/**
 * Send a verification email with a set-password link.
 * @param {string} email - Recipient email address
 * @param {string} token - Verification token
 */
const sendVerificationEmail = async (email, token) => {
  const transporter = createTransporter();
  const verificationUrl = `${process.env.CLIENT_URL}/set-password/${token}`;
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Email Verification',
    html: `
      <h1>Email Verification</h1>
      <p>Please click the link below to verify your email and set your password. The link will expire in 24 hours.</p>
      <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Verify Email & Set Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `
  };
  await transporter.sendMail(mailOptions);
};

/**
 * Send a password reset email with a reset link.
 * @param {string} email - Recipient email address
 * @param {string} token - Password reset token
 */
const sendPasswordResetEmail = async (email, token) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Password Reset',
    html: `
      <h1>Password Reset</h1>
      <p>Please click the link below to reset your password. The link will expire in 1 hour.</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `
  };
  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail
};

/*
 * End of emailUtils.js
 * Description: End of email utility file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private Limited
 */ 