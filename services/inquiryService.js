/*
 * File: inquiryService.js
 * Description: Handles inquiry creation, email notifications, and admin notifications for the CMS application.
 * Design & Developed by: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private Limited
 */

const Inquiry = require('../models/Inquiry');
const nodemailer = require('nodemailer');
const { createNotification, NOTIFICATION_TYPES } = require('./notificationService');
const User = require('../models/User');

/**
 * Create a nodemailer transporter for sending emails (Gmail SMTP).
 * Uses environment variables for credentials.
 */
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Generate a unique reference string for each inquiry.
 * Format: INQ-YYYYMMDD-XXXXX
 */
const generateReference = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `INQ-${y}${m}${d}-${rand}`;
};

/**
 * Send thank you email to inquirer and notification email to admin.
 * @param {Object} inquiry - The inquiry document
 * @returns {Object} - { sent: boolean, error: string|null }
 */
const sendEmails = async (inquiry) => {
  if (!transporter) {
    console.error('Email service is not configured');
    return { sent: false, error: 'Email service not configured' };
  }
  try {
    // Thank you email to inquirer
    const inquirerMailOptions = {
      from: {
        name: 'CMS System',
        address: process.env.EMAIL_FROM
      },
      to: inquiry.email,
      subject: 'Thank You for Your Inquiry',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Thank You for Your Inquiry</h2>
        <p>We have received your inquiry and will contact you soon.</p>
        <p><b>Reference:</b> ${inquiry.reference || ''}</p>
      </div>`
    };
    // Notification email to admin
    const adminMailOptions = {
      from: {
        name: 'CMS System',
        address: process.env.EMAIL_FROM
      },
      to: process.env.SMTP_USER,
      subject: 'New Inquiry Received',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Inquiry Received</h2>
        <p>A new inquiry has been submitted through the public form:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <ul style="list-style: none; padding: 0;">
            <li><strong>Name:</strong> ${inquiry.firstName} ${inquiry.lastName}</li>
            <li><strong>Email:</strong> ${inquiry.email}</li>
            <li><strong>Telephone:</strong> ${inquiry.telephone}</li>
            <li><strong>Company:</strong> ${inquiry.companyName}</li>
            <li><strong>Job Role:</strong> ${inquiry.jobRole}</li>
            <li><strong>Country:</strong> ${inquiry.country}</li>
            <li><strong>Use Case:</strong> ${inquiry.useCase}</li>
            <li><strong>Nature of Inquiry:</strong> ${inquiry.natureOfInquiry}</li>
            <li><strong>Project Description:</strong> ${inquiry.projectDescription}</li>
            <li><strong>Reference:</strong> ${inquiry.reference || ''}</li>
          </ul>
        </div>
        <p>Please follow up with this inquiry as soon as possible.</p>
      </div>`
    };
    let sent = true;
    let error = null;
    try {
      await transporter.sendMail(inquirerMailOptions);
      // Log for audit/debug
      console.log('Inquirer email sent successfully to:', inquiry.email);
    } catch (err) {
      sent = false;
      error = err.message;
      console.error('Error sending inquirer email:', err);
    }
    try {
      await transporter.sendMail(adminMailOptions);
      // Log for audit/debug
      console.log('Admin email sent successfully to:', process.env.SMTP_USER);
    } catch (err) {
      sent = false;
      error = err.message;
      console.error('Error sending admin email:', err);
    }
    return { sent, error };
  } catch (error) {
    console.error('Error sending emails:', error);
    return { sent: false, error: error.message };
  }
};

/**
 * Create a new inquiry, send emails, and notify all admins.
 * @param {Object} inquiryData - Data for the new inquiry
 * @returns {Object} - Inquiry object with emailSent status
 */
const createInquiry = async (inquiryData) => {
  try {
    if (!inquiryData.reference) {
      inquiryData.reference = generateReference();
    }
    const inquiry = new Inquiry(inquiryData);
    await inquiry.save();
    const emailResult = await sendEmails(inquiry);
    console.log('Email send result for inquiry:', inquiry._id, emailResult);
    // Create notification for all admin users
    try {
      const adminUsers = await User.find({ role: 'admin' });
      const notificationPromises = adminUsers.map(admin =>
        createNotification(
          admin._id,
          'New Inquiry Received',
          `New inquiry from ${inquiry.firstName} ${inquiry.lastName} (${inquiry.email})`,
          'success',
          'high',
          {
            inquiryId: inquiry._id,
            inquiryName: `${inquiry.firstName} ${inquiry.lastName}`,
            inquiryEmail: inquiry.email,
            companyName: inquiry.companyName,
            reference: inquiry.reference || '',
            createdAt: inquiry.createdAt,
            isNew: true
          }
        )
      );
      await Promise.all(notificationPromises);
    } catch (notifError) {
      // Log notification errors but do not interrupt main flow
      console.error('Error creating inquiry notifications:', notifError);
    }
    // Return inquiry object with emailSent status
    return { ...inquiry.toObject(), emailSent: emailResult.sent, emailError: emailResult.error };
  } catch (error) {
    console.error('Error creating inquiry:', error);
    throw error;
  }
};

/**
 * Get all inquiries with optional filters and options.
 * @param {Object} filters - MongoDB query filters
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - List of inquiries
 */
const getInquiries = async (filters = {}, options = {}) => {
  return Inquiry.find(filters, null, options);
};

/**
 * Update the status of an inquiry by ID.
 * @param {String} inquiryId - The inquiry's MongoDB ID
 * @param {String} status - The new status
 * @returns {Promise<Object>} - The updated inquiry
 */
const updateInquiryStatus = async (inquiryId, status) => {
  try {
    const inquiry = await Inquiry.findByIdAndUpdate(
      inquiryId,
      { status },
      { new: true }
    );
    if (!inquiry) {
      throw new Error('Inquiry not found');
    }
    return inquiry;
  } catch (error) {
    console.error('Error updating inquiry status:', error);
    throw error;
  }
};

/**
 * Delete an inquiry by ID.
 * @param {String} inquiryId - The inquiry's MongoDB ID
 * @returns {Promise<Object>} - The deleted inquiry
 */
const deleteInquiry = async (inquiryId) => {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(inquiryId);
    if (!inquiry) {
      throw new Error('Inquiry not found');
    }
    return inquiry;
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    throw error;
  }
};

module.exports = {
  createInquiry,
  getInquiries,
  updateInquiryStatus,
  deleteInquiry
};

/*
 * End of inquiryService.js
 * Description: End of inquiry service file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private Limited
 */ 