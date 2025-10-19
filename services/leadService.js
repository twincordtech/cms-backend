/*
 * File: leadService.js
 * Description: Handles lead creation, email notifications, meeting scheduling, and admin notifications for the CMS application.
 * Design & Developed by: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private Limited
 */

const Lead = require('../models/Lead');
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
 * Send thank you email to lead and notification email to admin.
 * @param {Object} lead - The lead document
 */
const sendEmails = async (lead) => {
  if (!transporter) {
    console.error('Email service is not configured');
    return;
  }
  try {
    // Thank you email to lead
    const leadMailOptions = {
      from: {
        name: 'CMS System',
        address: process.env.EMAIL_FROM
      },
      to: lead.email,
      subject: 'Thank You for Contacting Us',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Thank You for Contacting Us!</h2>
          <p>Dear ${lead.name},</p>
          <p>Thank you for reaching out to us. We have received your inquiry and will get back to you shortly.</p>
          <p>Here's a summary of your submission:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <ul style="list-style: none; padding: 0;">
              <li style="margin-bottom: 10px;"><strong>Name:</strong> ${lead.name}</li>
              <li style="margin-bottom: 10px;"><strong>Email:</strong> ${lead.email}</li>
              ${lead.phone ? `<li style="margin-bottom: 10px;"><strong>Phone:</strong> ${lead.phone}</li>` : ''}
              ${lead.company ? `<li style="margin-bottom: 10px;"><strong>Company:</strong> ${lead.company}</li>` : ''}
              ${lead.message ? `<li style="margin-bottom: 10px;"><strong>Message:</strong> ${lead.message}</li>` : ''}
            </ul>
          </div>
          <p>Our team will review your information and contact you soon.</p>
          <p>Best regards,<br>CMS System</p>
        </div>
      `
    };
    // Notification email to admin
    const adminMailOptions = {
      from: {
        name: 'CMS System',
        address: process.env.EMAIL_FROM
      },
      to: process.env.SMTP_USER, // Admin email
      subject: 'New Lead Received',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Lead Received</h2>
          <p>A new lead has been submitted through the contact form:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <ul style="list-style: none; padding: 0;">
              <li style="margin-bottom: 10px;"><strong>Name:</strong> ${lead.name}</li>
              <li style="margin-bottom: 10px;"><strong>Email:</strong> ${lead.email}</li>
              ${lead.phone ? `<li style="margin-bottom: 10px;"><strong>Phone:</strong> ${lead.phone}</li>` : ''}
              ${lead.company ? `<li style="margin-bottom: 10px;"><strong>Company:</strong> ${lead.company}</li>` : ''}
              ${lead.message ? `<li style="margin-bottom: 10px;"><strong>Message:</strong> ${lead.message}</li>` : ''}
            </ul>
          </div>
          <p>Please follow up with this lead as soon as possible.</p>
        </div>
      `
    };
    // Send both emails
    await Promise.all([
      transporter.sendMail(leadMailOptions),
      transporter.sendMail(adminMailOptions)
    ]);
    // Log for audit/debug
    console.log('Emails sent successfully to:', lead.email, 'and admin');
  } catch (error) {
    console.error('Error sending emails:', error);
  }
};

/**
 * Create a new lead, send emails, and notify all admins.
 * @param {Object} leadData - Data for the new lead
 * @returns {Object} - The created lead document
 */
const createLead = async (leadData) => {
  try {
    const lead = new Lead(leadData);
    await lead.save();
    // Send emails in background
    sendEmails(lead).catch(error => {
      console.error('Error sending emails:', error);
    });
    // Create notification for all admin users
    try {
      const adminUsers = await User.find({ role: 'admin' });
      const notificationPromises = adminUsers.map(admin => 
        createNotification(
          admin._id,
          'New Lead Received',
          `New lead from ${lead.name} (${lead.email})`,
          'success',
          'high',
          {
            leadId: lead._id,
            leadName: lead.name,
            leadEmail: lead.email,
            leadCompany: lead.company,
            createdAt: lead.createdAt,
            isNew: true
          }
        )
      );
      await Promise.all(notificationPromises);
    } catch (notifError) {
      // Log notification errors but do not interrupt main flow
      console.error('Error creating lead notifications:', notifError);
    }
    return lead;
  } catch (error) {
    console.error('Error creating lead:', error);
    throw error;
  }
};

/**
 * Get all leads (admin only) with pagination and filters.
 * @param {Object} filters - MongoDB query filters
 * @param {Object} sort - Sort options
 * @param {Number} page - Page number
 * @param {Number} limit - Results per page
 * @returns {Promise<Object>} - { leads, pagination }
 */
const getLeads = async (filters = {}, sort = { createdAt: -1 }, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    const leads = await Lead.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    const total = await Lead.countDocuments(filters);
    return {
      leads,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }
};

/**
 * Update the status of a lead by ID.
 * @param {String} leadId - The lead's MongoDB ID
 * @param {String} status - The new status
 * @returns {Promise<Object>} - The updated lead
 */
const updateLeadStatus = async (leadId, status) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      leadId,
      { status },
      { new: true }
    );
    if (!lead) {
      throw new Error('Lead not found');
    }
    return lead;
  } catch (error) {
    console.error('Error updating lead status:', error);
    throw error;
  }
};

/**
 * Delete a lead by ID.
 * @param {String} leadId - The lead's MongoDB ID
 * @returns {Promise<Object>} - The deleted lead
 */
const deleteLead = async (leadId) => {
  try {
    const lead = await Lead.findByIdAndDelete(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }
    return lead;
  } catch (error) {
    console.error('Error deleting lead:', error);
    throw error;
  }
};

/**
 * Send a meeting invitation email to the lead and scheduler.
 * @param {Object} lead - The lead document
 * @param {Object} meetingData - Meeting details
 * @param {Object} user - The user scheduling the meeting
 */
const sendMeetingInvitation = async (lead, meetingData, user) => {
  if (!transporter) {
    console.error('Email service is not configured');
    return;
  }
  try {
    const meetingMailOptions = {
      from: {
        name: 'CMS System',
        address: process.env.EMAIL_FROM
      },
      to: lead.email,
      subject: 'Meeting Invitation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Meeting Invitation</h2>
          <p>Dear ${lead.name},</p>
          <p>You have been invited to a meeting with our team.</p>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2563eb; margin-top: 0;">Meeting Details</h3>
            <p style="margin-bottom: 15px;">Please join the meeting using the link below:</p>
            <a href="${meetingData.meetingLink}" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; margin-bottom: 15px;">
              Join Meeting
            </a>
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 5px 0;"><strong>Company:</strong> ${lead.company || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Meeting Link:</strong> ${meetingData.meetingLink}</p>
              <p style="margin: 5px 0;"><strong>Scheduled By:</strong> ${user.name || user.email}</p>
            </div>
          </div>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>CMS System</p>
        </div>
      `
    };
    // Send notification to admin/scheduler
    const adminMailOptions = {
      from: {
        name: 'CMS System',
        address: process.env.EMAIL_FROM
      },
      to: user.email,
      subject: `Meeting Scheduled with ${lead.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Meeting Scheduled</h2>
          <p>You have scheduled a meeting with ${lead.name}.</p>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2563eb; margin-top: 0;">Meeting Details</h3>
            <div style="margin-top: 10px;">
              <p style="margin: 5px 0;"><strong>Lead Name:</strong> ${lead.name}</p>
              <p style="margin: 5px 0;"><strong>Lead Email:</strong> ${lead.email}</p>
              <p style="margin: 5px 0;"><strong>Company:</strong> ${lead.company || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Meeting Link:</strong> ${meetingData.meetingLink}</p>
            </div>
          </div>
        </div>
      `
    };
    // Send both emails
    await Promise.all([
      transporter.sendMail(meetingMailOptions),
      transporter.sendMail(adminMailOptions)
    ]);
    // Log for audit/debug
    console.log('Meeting invitation emails sent successfully');
  } catch (error) {
    console.error('Error sending meeting invitation:', error);
    throw error;
  }
};

/**
 * Schedule a meeting for a lead, send invitations, and notify all admins.
 * @param {String} leadId - The lead's MongoDB ID
 * @param {Object} meetingData - Meeting details
 * @param {Object} user - The user scheduling the meeting
 * @returns {Object} - Success message and updated lead
 */
const scheduleMeeting = async (leadId, meetingData, user) => {
  try {
    const lead = await Lead.findById(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }
    const meeting = {
      title: meetingData.title,
      description: meetingData.description,
      dateTime: new Date(`${meetingData.date} ${meetingData.time}`),
      duration: meetingData.duration,
      locationType: meetingData.locationType,
      location: meetingData.location,
      platform: meetingData.platform,
      meetingLink: meetingData.meetingLink,
      agenda: meetingData.agenda,
      scheduledBy: user._id,
      scheduledAt: new Date(),
      status: 'scheduled'
    };
    lead.meetings = lead.meetings || [];
    lead.meetings.push(meeting);
    await lead.save();
    // Send meeting invitation emails
    await sendMeetingInvitation(lead, meetingData, user);
    // Create notification for all admin users
    try {
      const adminUsers = await User.find({ role: 'admin' });
      const notificationPromises = adminUsers.map(admin => 
        createNotification(
          admin._id,
          'Meeting Scheduled',
          `Meeting scheduled with ${lead.name}`,
          NOTIFICATION_TYPES.INFO,
          'high',
          {
            leadId: lead._id,
            leadName: lead.name,
            leadEmail: lead.email,
            meetingId: meeting._id,
            meetingTitle: meeting.title,
            meetingDateTime: meeting.dateTime,
            meetingDuration: meeting.duration,
            meetingLink: meeting.meetingLink,
            locationType: meeting.locationType,
            platform: meeting.platform,
            scheduledBy: {
              id: user._id,
              name: user.name,
              email: user.email
            }
          }
        )
      );
      await Promise.all(notificationPromises);
    } catch (notifError) {
      // Log notification errors but do not interrupt main flow
      console.error('Error creating meeting notification:', notifError);
    }
    return {
      success: true,
      message: 'Meeting scheduled successfully',
      data: lead
    };
  } catch (error) {
    console.error('Error scheduling meeting:', error);
    throw error;
  }
};

module.exports = {
  createLead,
  getLeads,
  updateLeadStatus,
  deleteLead,
  scheduleMeeting
};

/*
 * End of leadService.js
 * Description: End of lead service file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private Limited
 */ 