/*
 * File: leadController.js
 * Description: Handles CRUD operations, status updates, meeting scheduling, and email notifications for leads in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const Lead = require('../models/Lead');
const leadService = require('../services/leadService');
const nodemailer = require('nodemailer');
const moment = require('moment');
const getEmailTemplate = require('../templates/meetingInvitation');

// Get all leads with pagination and filtering
exports.getLeads = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, sort = 'createdAt' } = req.query;
    // Build filters and sort options
    const filters = status ? { status } : {};
    const sortOptions = { [sort]: -1 };
    
    // Fetch leads with pagination and user population
    const leads = await Lead.find(filters)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('updatedBy', 'name email');
    
    // Get total count for pagination
    const total = await Lead.countDocuments(filters);
    
    // Respond with leads and pagination info
    res.json({
      success: true,
      data: leads,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    // Handle errors during lead fetch
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching leads'
    });
  }
};

// Get all leads without pagination
exports.getAllLeads = async (req, res) => {
  try {
    const { status } = req.query;
    // Build filters
    const filters = status ? { status } : {};
    
    // Fetch all leads sorted by creation date
    const leads = await Lead.find(filters)
      .sort({ createdAt: -1 })
      .populate('updatedBy', 'name email');
    
    res.json({
      success: true,
      data: leads
    });
  } catch (error) {
    // Handle errors during lead fetch
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching all leads'
    });
  }
}; 

// Get single lead by ID
exports.getLead = async (req, res) => {
  try {
    // Find lead by ID with user population
    const lead = await Lead.findById(req.params.leadId)
      .populate('updatedBy', 'name email')
      .populate('meetings.scheduledBy', 'name email');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    // Handle errors during lead fetch
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching lead'
    });
  }
};

// Create new lead
exports.createLead = async (req, res) => {
  try {
    // Create new lead document
    const lead = await Lead.create(req.body);
    res.status(201).json({
      success: true,
      data: lead
    });
  } catch (error) {
    // Handle errors during lead creation
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating lead'
    });
  }
};

// Update lead status and add to status history
exports.updateLeadStatus = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { status, feedback, clientName, clientEmail, company } = req.body;

    // Validate required fields
    if (!status || !feedback) {
      return res.status(400).json({
        success: false,
        message: 'Status and feedback are required'
      });
    }

    // Create new status history entry
    const newStatusHistory = {
      clientName,
      clientEmail,
      company,
      status,
      feedback,
      updatedBy: req.user._id
    };

    // Update lead with new status and status history
    const lead = await Lead.findByIdAndUpdate(
      leadId,
      { 
        $set: {
          status,
          feedback,
          updatedBy: req.user._id
        },
        $push: {
          statusHistory: newStatusHistory
        }
      },
      { 
        new: true,
        runValidators: true
      }
    ).populate('updatedBy', 'name email')
     .populate('statusHistory.updatedBy', 'name email');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    // Handle errors during lead status update
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating lead status'
    });
  }
};

// Delete lead by ID
exports.deleteLead = async (req, res) => {
  try {
    // Delete lead document by ID
    const lead = await Lead.findByIdAndDelete(req.params.leadId);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    // Handle errors during lead deletion
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting lead'
    });
  }
};

// Schedule meeting for a lead and send email invitation
exports.scheduleMeeting = async (req, res) => {
  try {
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
      agenda,
      leadId
    } = req.body;

    // Validate required fields
    if (!title || !description || !date || !time || !duration || !locationType) {
      return res.status(400).json({
        status: 5000,
        message: 'Missing required fields'
      });
    }

    // Additional validation for virtual meetings
    if (locationType === 'virtual') {
      if (!platform) {
        return res.status(400).json({
          status: 5000,
          message: 'Platform is required for virtual meetings'
        });
      }
      if (!meetingLink) {
        return res.status(400).json({
          status: 5000,
          message: 'Meeting link is required for virtual meetings'
        });
      }

      // Validate meeting link format
      const patterns = {
        meet: /^https:\/\/meet\.google\.com\/[a-z0-9\-]+$/i,
        zoom: /^https:\/\/[a-z0-9-.]+\.zoom\.us\/j\/[0-9]+$/i
      };

      if (!patterns[platform].test(meetingLink)) {
        return res.status(400).json({
          status: 5000,
          message: `Invalid ${platform} meeting link format`
        });
      }
    }

    // Additional validation for offline meetings
    if (locationType === 'offline' && !location) {
      return res.status(400).json({
        status: 5000,
        message: 'Location is required for offline meetings'
      });
    }

    try {
      // Format date and time using moment
      const dateTime = moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm').toDate();

      // Create meeting object
      const newMeeting = {
        title: title.trim(),
        description: description.trim(),
        dateTime,
        duration,
        locationType,
        location: locationType === 'offline' ? location.trim() : '',
        platform: locationType === 'virtual' ? platform : undefined,
        meetingLink: locationType === 'virtual' ? meetingLink.trim() : '',
        agenda: agenda ? agenda.trim() : '',
        scheduledBy: req.user._id,
        status: 'scheduled'
      };

      // Find the lead first to get the email
      const lead = await Lead.findById(leadId);
      if (!lead) {
        return res.status(404).json({
          status: 5000,
          message: 'Lead not found'
        });
      }

      // Configure nodemailer with detailed error handling
      let transporter;
      try {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          },
          debug: true, // Enable debug logs
          logger: true  // Log to console
        });

        // Verify SMTP connection
        await transporter.verify();
        // console.log('SMTP connection verified successfully'); // Removed for production cleanliness
      } catch (error) {
        // console.error('SMTP Configuration Error:', error); // Removed for production cleanliness
        throw new Error('Failed to configure email service');
      }

      // Generate email content using the template
      const emailContent = getEmailTemplate({
        clientName: lead.name,
        title,
        description,
        dateTime,
        duration,
        locationType,
        location,
        platform,
        meetingLink,
        agenda,
        schedulerName: req.user.name,
        schedulerPosition: req.user.designation || ''
      });

      // Send email with detailed error handling
      try {
        const info = await transporter.sendMail({
          from: {
            name: req.user.name,
            address: process.env.SMTP_FROM || process.env.SMTP_USER
          },
          to: {
            name: lead.name,
            address: lead.email
          },
          subject: `Meeting Invitation: ${title}`,
          html: emailContent
        });

        // console.log('Email sent successfully:', info.messageId); // Removed for production cleanliness
      } catch (error) {
        // console.error('Email Sending Error:', error); // Removed for production cleanliness
        throw new Error('Failed to send meeting invitation email');
      }

      // Update the lead with the new meeting
      const updatedLead = await Lead.findByIdAndUpdate(
        leadId,
        { 
          $push: { 
            meetings: newMeeting 
          }
        },
        { 
          new: true,
          runValidators: true
        }
      );

      // Return success response
      return res.status(200).json({
        status: 6000,
        message: 'Meeting scheduled successfully',
        data: updatedLead
      });

    } catch (error) {
      // console.error('Error in meeting scheduling:', error); // Removed for production cleanliness
      
      // Check if it's a validation error
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          status: 5000,
          message: 'Invalid meeting data: ' + Object.values(error.errors).map(err => err.message).join(', ')
        });
      }

      return res.status(500).json({
        status: 5000,
        message: error.message || 'Error scheduling meeting'
      });
    }
  } catch (error) {
    // console.error('Error scheduling meeting:', error); // Removed for production cleanliness
    return res.status(500).json({
      status: 5000,
      message: error.message || 'Error scheduling meeting'
    });
  }
};

// Get lead status history
exports.getLeadHistory = async (req, res) => {
  try {
    // Find lead by ID with status history population
    const lead = await Lead.findById(req.params.leadId)
      .populate('statusHistory.updatedBy', 'name email');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      data: lead.statusHistory
    });
  } catch (error) {
    // Handle errors during lead history fetch
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving lead history'
    });
  }
};

// Update lead feedback
exports.updateLeadFeedback = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { feedback } = req.body;

    // Validate required fields
    if (!feedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback is required'
      });
    }

    // Update lead feedback
    const lead = await Lead.findByIdAndUpdate(
      leadId,
      { 
        feedback,
        updatedBy: req.user._id
      },
      { new: true }
    ).populate('updatedBy', 'name email');
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    // Handle errors during lead feedback update
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating lead feedback'
    });
  }
};

// End of leadController.js
// Description: End of lead controller file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private.