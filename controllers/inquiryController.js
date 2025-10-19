/*
 * File: inquiryController.js
 * Description: Handles CRUD operations, status updates, meeting scheduling, and notifications for inquiries in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const Inquiry = require('../models/Inquiry');
const inquiryService = require('../services/inquiryService');
const notificationService = require('../services/notificationService');

// Get all inquiries with optional status filter and pagination
exports.getInquiries = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, sort = 'createdAt' } = req.query;
    // Build filters and sort options
    const filters = status ? { status } : {};
    const sortOptions = { [sort]: -1 };
    // Fetch inquiries with pagination and user population
    const inquiries = await Inquiry.find(filters)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('updatedBy', 'firstName lastName email');
    // Get total count for pagination
    const total = await Inquiry.countDocuments(filters);
    // Respond with inquiries and pagination info
    res.json({
      success: true,
      data: inquiries,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching inquiries' });
  }
};

// Get single inquiry by ID
exports.getInquiry = async (req, res) => {
  try {
    // Find inquiry by ID
    const inquiry = await Inquiry.findById(req.params.inquiryId)
      .populate('updatedBy', 'firstName lastName email');
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }
    res.json({ success: true, data: inquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching inquiry' });
  }
};

// Create new inquiry (public)
exports.createInquiry = async (req, res) => {
  try {
    // Use inquiry service to create a new inquiry
    const inquiry = await inquiryService.createInquiry(req.body);
    res.status(201).json({ success: true, data: inquiry });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Error creating inquiry' });
  }
};

// Update inquiry status and add to status history
exports.updateInquiryStatus = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const { status, feedback } = req.body;
    if (!status || !feedback) {
      return res.status(400).json({ success: false, message: 'Status and feedback are required' });
    }
    // Build new status history entry
    const newStatusHistory = {
      status,
      feedback,
      updatedBy: req.user._id
    };
    // Update inquiry with new status and status history
    const inquiry = await Inquiry.findByIdAndUpdate(
      inquiryId,
      {
        $set: { status, feedback, updatedBy: req.user._id },
        $push: { statusHistory: newStatusHistory }
      },
      { new: true, runValidators: true }
    ).populate('updatedBy', 'firstName lastName email');
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }
    res.json({ success: true, data: inquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error updating inquiry status' });
  }
};

// Delete inquiry by ID
exports.deleteInquiry = async (req, res) => {
  try {
    // Delete inquiry document by ID
    const inquiry = await Inquiry.findByIdAndDelete(req.params.inquiryId);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }
    res.json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting inquiry' });
  }
};

// Schedule a meeting for an inquiry and send notifications
exports.scheduleInquiryMeeting = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const {
      title,
      description,
      date,
      time,
      duration,
      locationType,
      location,
      meetingLink,
      platform,
      agenda
    } = req.body;

    // Validate required meeting fields
    if (!title || !description || !date || !time || !duration || !locationType) {
      return res.status(400).json({ success: false, message: 'Missing required meeting fields' });
    }

    // Compose dateTime from date and time
    const dateTime = new Date(`${date}T${time}`);

    // Build meeting object
    const meeting = {
      title,
      description,
      dateTime,
      duration,
      locationType,
      location: locationType === 'offline' ? location : '',
      meetingLink: locationType === 'virtual' ? meetingLink : '',
      platform: locationType === 'virtual' ? platform : '',
      agenda,
      scheduledBy: req.user?._id || null
    };

    // Compose meeting summary for status history
    const meetingSummary = `Meeting scheduled: ${title} on ${dateTime.toLocaleString()} (${duration})`;
    const statusHistoryEntry = {
      status: 'meeting_scheduled',
      feedback: meetingSummary,
      updatedBy: req.user._id,
      updatedAt: new Date()
    };

    // Add meeting and status history entry to inquiry
    const inquiry = await Inquiry.findByIdAndUpdate(
      inquiryId,
      { $push: { meetings: meeting, statusHistory: statusHistoryEntry } },
      { new: true }
    );

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    // Send meeting invitation email
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      const mailOptions = {
        from: {
          name: 'CMS System',
          address: process.env.EMAIL_FROM
        },
        to: inquiry.email,
        subject: `Meeting Scheduled: ${title}`,
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Meeting Scheduled</h2>
          <p>Dear ${inquiry.firstName},</p>
          <p>Your meeting has been scheduled with the following details:</p>
          <ul>
            <li><b>Title:</b> ${title}</li>
            <li><b>Description:</b> ${description}</li>
            <li><b>Date & Time:</b> ${dateTime.toLocaleString()}</li>
            <li><b>Duration:</b> ${duration}</li>
            <li><b>Type:</b> ${locationType}</li>
            ${locationType === 'virtual' ? `<li><b>Platform:</b> ${platform}</li><li><b>Meeting Link:</b> <a href="${meetingLink}">${meetingLink}</a></li>` : `<li><b>Location:</b> ${location}</li>`}
            ${agenda ? `<li><b>Agenda:</b> ${agenda}</li>` : ''}
          </ul>
          <p>Thank you!</p>
        </div>`
      };
      await transporter.sendMail(mailOptions);
    } catch (err) {
      // Log email sending errors for debugging
      // (Not critical for main flow)
      // console.error('Error sending meeting invitation email:', err);
    }

    // Create notification for the user who scheduled the meeting
    try {
      const meetingId = inquiry.meetings[inquiry.meetings.length - 1]?._id;
      await notificationService.createNotification(
        req.user._id,
        'Meeting Scheduled',
        `Your meeting "${title}" has been scheduled for ${dateTime.toLocaleString()}`,
        'info',
        'high',
        { meetingId, inquiryId, type: 'meeting_scheduled' }
      );
    } catch (err) {
      // Log notification errors for debugging
      // (Not critical for main flow)
      // console.error('Error creating meeting notification:', err);
    }

    res.status(200).json({ success: true, data: inquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error scheduling meeting' });
  }
};

// End of inquiryController.js
// Description: End of inquiry controller file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 