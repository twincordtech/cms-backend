/*
 * File: emailService.js
 * Description: Handles all email sending logic, including newsletters, using nodemailer for the CMS application.
 * Design & Developed by: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private Limited
 */

const nodemailer = require('nodemailer');
const Subscriber = require('../models/Subscriber');
const User = require('../models/User');
const { createNewsletterNotification } = require('./notificationService');

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
      ciphers: 'SSLv3'
    },
    // Add debugging in development
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  });
};

/**
 * Send a newsletter to all subscribers.
 * Updates newsletter status, tracks sent/failed emails, and notifies admins.
 * @param {Object} newsletter - The newsletter document to send  
 * @returns {Object} - Summary of send results
 * @throws {Error} - If sending fails or no subscribers found
 */
const sendNewsletter = async (newsletter) => {
  try {
    // Check if email configuration is available
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('Email configuration incomplete. Skipping newsletter send.');
      return {
        total: 0,
        sent: 0,
        failed: 0,
        error: 'Email configuration incomplete'
      };
    }

    const transporter = createTransporter();
    
    // Verify SMTP connection before sending
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (verifyError) {
      console.warn('SMTP verification failed, but continuing:', verifyError.message);
      // Continue anyway as some providers don't support verify
    }

    // Fetch all subscribers (active/inactive)
    const subscribers = await Subscriber.find();
    if (subscribers.length === 0) {
      throw new Error('No subscribers found');
    }

    const sentTo = [];
    const failedTo = [];

    // Send the newsletter to each subscriber
    for (const subscriber of subscribers) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: subscriber.email,
          subject: newsletter.subject,
          html: newsletter.content
        });
        sentTo.push({
          email: subscriber.email,
          status: 'success',
          sentAt: new Date()
        });
      } catch (error) {
        // Log and track failed sends
        console.error(`Failed to send to ${subscriber.email}:`, error.message);
        failedTo.push({
          email: subscriber.email,
          status: 'failed',
          error: error.message,
          sentAt: new Date()
        });
      }
    }

    // Update newsletter document with send results
    newsletter.status = 'sent';
    newsletter.sentAt = new Date();
    newsletter.sentTo = [...sentTo, ...failedTo];
    await newsletter.save();

    // Notify all admin users of the send event
    try {
      const adminUsers = await User.find({ role: 'admin' });
      await createNewsletterNotification(adminUsers, newsletter, 'sent');
    } catch (notifError) {
      // Log notification errors but do not interrupt main flow
      console.error('Error creating newsletter notification:', notifError.message);
    }

    return {
      total: subscribers.length,
      sent: sentTo.length,
      failed: failedTo.length
    };
  } catch (error) {
    // Log and rethrow for upstream error handling
    console.error('Error sending newsletter:', error.message);
    throw error;
  }
};

module.exports = {
  sendNewsletter
};

/*
 * End of emailService.js
 * Description: End of email service file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private Limited
 */