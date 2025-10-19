/*
 * File: newsletter.js
 * Description: Express routes for newsletter and subscriber management in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const express = require('express');
const router = express.Router();
const { protect, authorizeAdmin } = require('../middleware/auth');
const Subscriber = require('../models/Subscriber');
const Newsletter = require('../models/Newsletter');
// const { sendNewsletter } = require('../services/emailService'); // Temporarily commented out
const { createNotification, NOTIFICATION_TYPES } = require('../services/notificationService');
const User = require('../models/User');
const asyncHandler = require('../middleware/async');
const cron = require('node-cron');

// Utility to sanitize string input
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.]/g, '').trim();
};

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
router.post('/subscribe', asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  let subscriber = await Subscriber.findOne({ email });
  
  if (subscriber) {
    if (subscriber.isActive) {
      return res.status(400).json({ message: 'Email is already subscribed' });
    } else {
      // Reactivate subscription
      subscriber.isActive = true;
      subscriber.unsubscribedAt = null;
      await subscriber.save();

      // Create notification for admin users
      try {
        const adminUsers = await User.find({ role: 'admin' });
        const notificationPromises = adminUsers.map(admin => 
          createNotification(
            admin._id,
            'Newsletter Subscription Reactivated',
            `${email} has reactivated their newsletter subscription`,
            NOTIFICATION_TYPES.NEWSLETTER,
            'medium',
            {
              email,
              type: 'reactivation',
              subscribedAt: new Date()
            }
          )
        );
        await Promise.all(notificationPromises);
      } catch (error) {
        console.error('Error creating subscription notification:', error);
      }

      return res.status(200).json({ message: 'Subscription reactivated successfully' });
    }
  }

  subscriber = await Subscriber.create({ email });

  // Create notification for admin users
  try {
    const adminUsers = await User.find({ role: 'admin' });
    const notificationPromises = adminUsers.map(admin => 
      createNotification(
        admin._id,
        'New Newsletter Subscription',
        `${email} has subscribed to the newsletter`,
        NOTIFICATION_TYPES.NEWSLETTER,
        'medium',
        {
          email,
          type: 'subscription',
          subscribedAt: subscriber.createdAt
        }
      )
    );
    await Promise.all(notificationPromises);
  } catch (error) {
    console.error('Error creating subscription notification:', error);
  }

  res.status(201).json({ message: 'Subscribed successfully' });
}));

// @desc    Unsubscribe from newsletter
// @route   POST /api/newsletter/unsubscribe
// @access  Public
router.post('/unsubscribe', asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const subscriber = await Subscriber.findOne({ email });
  
  if (!subscriber || !subscriber.isActive) {
    return res.status(400).json({ message: 'Email is not subscribed' });
  }

  subscriber.isActive = false;
  subscriber.unsubscribedAt = Date.now();
  await subscriber.save();

  // Create notification for admin users
  try {
    const adminUsers = await User.find({ role: 'admin' });
    const notificationPromises = adminUsers.map(admin => 
      createNotification(
        admin._id,
        'Newsletter Unsubscription',
        `${email} has unsubscribed from the newsletter`,
        NOTIFICATION_TYPES.NEWSLETTER,
        'medium',
        {
          email,
          type: 'unsubscription',
          unsubscribedAt: subscriber.unsubscribedAt
        }
      )
    );
    await Promise.all(notificationPromises);
  } catch (error) {
    console.error('Error creating unsubscription notification:', error);
  }

  res.status(200).json({ message: 'Unsubscribed successfully' });
}));

// @desc    Get all subscribers
// @route   GET /api/newsletter/subscribers
// @access  Private/Admin
router.get('/subscribers', protect, authorizeAdmin, asyncHandler(async (req, res) => {
  const subscribers = await Subscriber.find().sort('-createdAt');

  res.status(200).json({
    success: true,
    count: subscribers.length,
    data: subscribers
  });
}));

// @desc    Get single subscriber
// @route   GET /api/newsletter/subscribers/:id
// @access  Private/Admin
router.get('/subscribers/:id', protect, authorizeAdmin, asyncHandler(async (req, res) => {
  const subscriber = await Subscriber.findById(req.params.id);

  if (!subscriber) {
    return res.status(404).json({ 
      success: false, 
      error: 'Subscriber not found' 
    });
  }

  res.status(200).json({
    success: true,
    data: subscriber
  });
}));

// @desc    Update subscriber
// @route   PUT /api/newsletter/subscribers/:id
// @access  Private/Admin
router.put('/subscribers/:id', protect, authorizeAdmin, asyncHandler(async (req, res) => {
  const { email, status, source } = req.body;

  let subscriber = await Subscriber.findById(req.params.id);

  if (!subscriber) {
    return res.status(404).json({ 
      success: false, 
      error: 'Subscriber not found' 
    });
  }

  // Check if email is being changed and if it already exists
  if (email && email !== subscriber.email) {
    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email address already exists' 
      });
    }
  }

  subscriber = await Subscriber.findByIdAndUpdate(
    req.params.id, 
    {
      email: email || subscriber.email,
      status: status || subscriber.status,
      source: source || subscriber.source,
      unsubscribedAt: status === 'inactive' ? new Date() : null
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: subscriber
  });
}));

// @desc    Delete subscriber
// @route   DELETE /api/newsletter/subscribers/:id
// @access  Private/Admin
router.delete('/subscribers/:id', protect, authorizeAdmin, asyncHandler(async (req, res) => {
  const subscriber = await Subscriber.findById(req.params.id);

  if (!subscriber) {
    return res.status(404).json({ 
      success: false, 
      error: 'Subscriber not found' 
    });
  }

  await subscriber.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Subscriber deleted successfully',
    data: {}
  });
}));

// @desc    Create newsletter
// @route   POST /api/newsletter
// @access  Private/Admin
router.post('/', protect, authorizeAdmin, asyncHandler(async (req, res) => {
  const { subject, content, contentType } = req.body;

  if (!subject || !content) {
    return res.status(400).json({ message: 'Subject and content are required' });
  }

  const newsletter = await Newsletter.create({
    subject,
    content,
    contentType: contentType || 'html',
    createdBy: req.user.id
  });

  res.status(201).json(newsletter);
}));

// @desc    Get all newsletters
// @route   GET /api/newsletter
// @access  Private/Admin
router.get('/', protect, authorizeAdmin, asyncHandler(async (req, res) => {
  const newsletters = await Newsletter.find().sort('-createdAt');

  res.status(200).json({
    success: true,
    data: newsletters
  });
}));

// @desc    Get single newsletter
// @route   GET /api/newsletter/:id
// @access  Private/Admin
router.get('/:id', protect, authorizeAdmin, asyncHandler(async (req, res) => {
  const newsletter = await Newsletter.findById(req.params.id);

  if (!newsletter) {
    return res.status(404).json({ 
      success: false, 
      error: 'Newsletter not found' 
    });
  }

  res.status(200).json({
    success: true,
    data: newsletter
  });
}));

// @desc    Update newsletter
// @route   PUT /api/newsletter/:id
// @access  Private/Admin
router.put('/:id', protect, authorizeAdmin, asyncHandler(async (req, res) => {
  let newsletter = await Newsletter.findById(req.params.id);

  if (!newsletter) {
    return res.status(404).json({ 
      success: false, 
      error: 'Newsletter not found' 
    });
  }

  if (newsletter.status === 'sent') {
    return res.status(400).json({ 
      success: false, 
      error: 'Cannot update sent newsletter' 
    });
  }

  newsletter = await Newsletter.findByIdAndUpdate(
    req.params.id, 
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: newsletter
  });
}));

// @desc    Delete newsletter
// @route   DELETE /api/newsletter/:id
// @access  Private/Admin
router.delete('/:id', protect, authorizeAdmin, asyncHandler(async (req, res) => {
  const newsletter = await Newsletter.findById(req.params.id);

  if (!newsletter) {
    return res.status(404).json({ 
      success: false, 
      error: 'Newsletter not found' 
    });
  }

  // Allow deletion of any newsletter (including sent ones)
  // Remove the restriction to allow users to delete sent newsletters if needed
  
  await newsletter.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
}));

// @desc    Send newsletter
// @route   POST /api/newsletter/:id/send
// @access  Private/Admin
router.post('/:id/send', protect, authorizeAdmin, asyncHandler(async (req, res) => {
  const newsletter = await Newsletter.findById(req.params.id);
  if (!newsletter) {
    return res.status(404).json({ success: false, message: 'Newsletter not found' });
  }

  if (newsletter.status === 'sent') {
    return res.status(400).json({ success: false, message: 'Newsletter has already been sent' });
  }

  try {
    const stats = await sendNewsletter(newsletter);
    res.json({
      success: true,
      data: {
        newsletter,
        stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending newsletter',
      error: error.message
    });
  }
}));

// Schedule newsletter
router.post('/:id/schedule', protect, authorizeAdmin, asyncHandler(async (req, res) => {
  // Log the incoming schedule data for debugging
  console.log('SCHEDULE NEWSLETTER PAYLOAD:', req.body);
  const {
    frequency,
    scheduleTime,
    startDate,
    endDate,
    customDates,
    weekdays,
    monthlyConfig
  } = req.body;

  const newsletter = await Newsletter.findById(req.params.id);
  if (!newsletter) {
    return res.status(404).json({ message: 'Newsletter not found' });
  }

  // Calculate next send date using helper function
  let nextSendDate;
  try {
    nextSendDate = calculateNextSendDate(frequency, startDate, scheduleTime, weekdays, monthlyConfig, customDates);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  newsletter.schedule = {
    frequency,
    scheduleTime,
    startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : null,
    customDates: customDates ? customDates.map(date => new Date(date)) : null,
    weekdays,
    monthlyConfig,
    nextSendDate
  };
  newsletter.status = 'scheduled';

  await newsletter.save();

  // Schedule the newsletter
  scheduleNewsletter(newsletter);

  res.json({ 
    message: 'Newsletter scheduled successfully',
    data: newsletter 
  });
}));

// Update schedule
router.put('/:id/schedule', protect, authorizeAdmin, asyncHandler(async (req, res) => {
  // Log the incoming update schedule data for debugging
  console.log('UPDATE SCHEDULE PAYLOAD:', req.body);
  const {
    frequency,
    scheduleTime,
    startDate,
    endDate,
    customDates,
    weekdays,
    monthlyConfig
  } = req.body;

  const newsletter = await Newsletter.findById(req.params.id);
  if (!newsletter) {
    return res.status(404).json({ message: 'Newsletter not found' });
  }

  if (!newsletter.schedule) {
    return res.status(400).json({ message: 'Newsletter is not scheduled' });
  }

  // Calculate next send date using helper function
  let nextSendDate;
  try {
    nextSendDate = calculateNextSendDate(frequency, startDate, scheduleTime, weekdays, monthlyConfig, customDates);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  // Update schedule
  newsletter.schedule = {
    frequency,
    scheduleTime,
    startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : null,
    customDates: customDates ? customDates.map(date => new Date(date)) : null,
    weekdays,
    monthlyConfig,
    nextSendDate
  };

  await newsletter.save();

  // Reschedule the newsletter
  scheduleNewsletter(newsletter);

  res.json({ 
    message: 'Schedule updated successfully',
    data: newsletter 
  });
}));

// Cancel schedule
router.post('/:id/cancel-schedule', protect, authorizeAdmin, asyncHandler(async (req, res) => {
  const newsletter = await Newsletter.findById(req.params.id);
  if (!newsletter) {
    return res.status(404).json({ message: 'Newsletter not found' });
  }

  // Use findByIdAndUpdate to avoid validation issues
  const updatedNewsletter = await Newsletter.findByIdAndUpdate(
    req.params.id,
    {
      $unset: { schedule: 1 },
      status: 'draft'
    },
    { 
      new: true, 
      runValidators: false,
      setDefaultsOnInsert: false
    }
  );

  res.json({ 
    message: 'Schedule cancelled successfully',
    data: updatedNewsletter 
  });
}));

// Get scheduled newsletters
router.get('/scheduled', protect, authorizeAdmin, asyncHandler(async (req, res) => {
  const newsletters = await Newsletter.find({
    status: 'scheduled',
    'schedule.nextSendDate': { $exists: true }
  });
  res.json({ data: newsletters });
}));

// Get specific newsletter schedule
router.get('/:id/schedule', protect, authorizeAdmin, asyncHandler(async (req, res) => {
  const newsletter = await Newsletter.findById(req.params.id);
  if (!newsletter) {
    return res.status(404).json({ message: 'Newsletter not found' });
  }
  res.json({ data: newsletter.schedule });
}));

// Function to schedule newsletter sending
// Helper function to calculate next send date with validation
const calculateNextSendDate = (frequency, startDate, scheduleTime, weekdays, monthlyConfig, customDates) => {
  // Validate input parameters
  if (!frequency || !startDate || !scheduleTime) {
    throw new Error('Missing required parameters: frequency, startDate, or scheduleTime');
  }
  
  // Validate time format
  if (!/^\d{1,2}:\d{2}$/.test(scheduleTime)) {
    throw new Error('Invalid time format. Use HH:MM format (e.g., 14:30)');
  }
  
  // Parse time components
  const [hours, minutes] = scheduleTime.split(':').map(Number);
  
  // Validate time components
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error('Invalid time values. Hours must be 0-23, minutes must be 0-59');
  }
  
  // Validate startDate
  const startDateObj = new Date(startDate);
  if (isNaN(startDateObj.getTime())) {
    throw new Error('Invalid start date');
  }
  
  // Set next send date based on frequency
  let nextSendDate = new Date(startDateObj);
  nextSendDate.setHours(hours, minutes, 0, 0);

  // If the scheduled time is in the past for today, move to next occurrence
  if (nextSendDate < new Date()) {
    switch (frequency) {
      case 'daily':
        nextSendDate.setDate(nextSendDate.getDate() + 1);
        break;
      case 'weekly':
        if (weekdays && weekdays.length > 0) {
          // Validate weekdays array
          const validWeekdays = weekdays.filter(day => day >= 0 && day <= 6);
          if (validWeekdays.length === 0) {
            throw new Error('No valid weekdays provided. Weekdays must be 0-6 (Sunday-Saturday)');
          }
          
          // Find next available weekday
          let found = false;
          let currentDate = new Date(nextSendDate);
          let attempts = 0;
          const maxAttempts = 10; // Prevent infinite loop
          
          while (!found && attempts < maxAttempts) {
            if (validWeekdays.includes(currentDate.getDay())) {
              found = true;
              nextSendDate = new Date(currentDate);
            } else {
              currentDate.setDate(currentDate.getDate() + 1);
              attempts++;
            }
          }
          
          if (!found) {
            throw new Error('Could not find valid weekday for schedule within 10 days');
          }
        } else {
          nextSendDate.setDate(nextSendDate.getDate() + 7);
        }
        break;
      case 'monthly':
        if (monthlyConfig) {
          if (monthlyConfig.type === 'date') {
            // Validate monthly date
            const dayOfMonth = monthlyConfig.date || 1;
            if (dayOfMonth < 1 || dayOfMonth > 31) {
              throw new Error('Invalid day of month. Must be between 1 and 31');
            }
            
            // Check if the day exists in the current month
            const testDate = new Date(nextSendDate);
            testDate.setDate(dayOfMonth);
            
            // If the day doesn't exist in this month (e.g., Feb 30), move to next month
            if (testDate.getDate() !== dayOfMonth) {
              nextSendDate.setMonth(nextSendDate.getMonth() + 1);
            }
            
            nextSendDate.setDate(dayOfMonth);
            if (nextSendDate < new Date()) {
              nextSendDate.setMonth(nextSendDate.getMonth() + 1);
            }
          } else {
            // Handle specific day (e.g., last Friday)
            const week = monthlyConfig.week || 1;
            const day = monthlyConfig.day || 1;
            
            if (week < -1 || week > 4) {
              throw new Error('Invalid week number');
            }
            
            if (day < 0 || day > 6) {
              throw new Error('Invalid day of week');
            }
            
            let targetDate = new Date(nextSendDate);
            targetDate.setDate(1); // Start from beginning of month
            
            if (week === -1) {
              // Last week
              targetDate.setMonth(targetDate.getMonth() + 1);
              targetDate.setDate(0);
              while (targetDate.getDay() !== day) {
                targetDate.setDate(targetDate.getDate() - 1);
              }
            } else {
              // Specific week
              let found = false;
              let weekCount = 0;
              let attempts = 0;
              const maxAttempts = 31; // Prevent infinite loop
              
              while (!found && attempts < maxAttempts) {
                if (targetDate.getDay() === day) {
                  weekCount++;
                  if (weekCount === week) {
                    found = true;
                    nextSendDate = new Date(targetDate);
                    break;
                  }
                }
                targetDate.setDate(targetDate.getDate() + 1);
                attempts++;
              }
              
              if (!found) {
                // If we couldn't find the specific week in this month, try next month
                targetDate = new Date(nextSendDate);
                targetDate.setMonth(targetDate.getMonth() + 1);
                targetDate.setDate(1);
                
                weekCount = 0;
                attempts = 0;
                
                while (!found && attempts < maxAttempts) {
                  if (targetDate.getDay() === day) {
                    weekCount++;
                    if (weekCount === week) {
                      found = true;
                      nextSendDate = new Date(targetDate);
                      break;
                    }
                  }
                  targetDate.setDate(targetDate.getDate() + 1);
                  attempts++;
                }
              }
              
              if (!found) {
                throw new Error(`Could not find ${week === 1 ? 'first' : week === 2 ? 'second' : week === 3 ? 'third' : 'fourth'} ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]} of the month`);
              }
            }
            
            // Additional validation for monthly schedules
            if (isNaN(nextSendDate.getTime())) {
              throw new Error('Invalid monthly schedule configuration');
            }
          }
        } else {
          nextSendDate.setMonth(nextSendDate.getMonth() + 1);
        }
        break;
      case 'custom':
        if (customDates && customDates.length > 0) {
          const validDates = customDates
            .map(date => new Date(date))
            .filter(date => !isNaN(date.getTime()))
            .sort((a, b) => a - b);
          
          if (validDates.length === 0) {
            throw new Error('No valid dates provided in custom dates array');
          }
          
          const futureDate = validDates.find(date => date > new Date());
          if (futureDate) {
            nextSendDate = new Date(futureDate);
            nextSendDate.setHours(hours, minutes, 0, 0);
          } else {
            throw new Error('No valid future dates found for custom schedule. All provided dates are in the past');
          }
        } else {
          throw new Error('Custom schedule requires custom dates array');
        }
        break;
      default:
        throw new Error('Invalid frequency');
    }
  }

  // Final validation of nextSendDate
  if (isNaN(nextSendDate.getTime())) {
    console.error('Date calculation failed:', {
      frequency,
      startDate,
      scheduleTime,
      weekdays,
      monthlyConfig,
      customDates,
      calculatedDate: nextSendDate
    });
    throw new Error('Invalid next send date calculated');
  }
  
  console.log('Successfully calculated next send date:', {
    frequency,
    startDate,
    scheduleTime,
    nextSendDate: nextSendDate.toISOString()
  });
  
  return nextSendDate;
};

const scheduleNewsletter = (newsletter) => {
  const { schedule } = newsletter;
  if (!schedule || !schedule.nextSendDate) return;

  const date = new Date(schedule.nextSendDate);
  const cronExpression = `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;

  cron.schedule(cronExpression, async () => {
    try {
      // Send newsletter
      await sendNewsletter(newsletter);

      // Update next send date based on frequency
      if (schedule.frequency !== 'once') {
        let nextDate = new Date(schedule.nextSendDate);
        
        switch (schedule.frequency) {
          case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'custom':
            const sentDate = new Date(schedule.nextSendDate);
            const nextCustomDate = schedule.customDates.find(date => date > sentDate);
            if (nextCustomDate) {
              nextDate = new Date(nextCustomDate);
              nextDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
            } else {
              // No more custom dates, mark as sent
              newsletter.status = 'sent';
              newsletter.schedule.nextSendDate = null;
              await newsletter.save();
              return;
            }
            break;
        }

        // Check if we've passed the end date
        if (schedule.endDate && nextDate > schedule.endDate) {
          newsletter.status = 'sent';
          newsletter.schedule.nextSendDate = null;
        } else {
          newsletter.schedule.nextSendDate = nextDate;
          newsletter.schedule.lastSentDate = new Date();
          // Reschedule for next occurrence
          scheduleNewsletter(newsletter);
        }
      } else {
        // One-time schedule completed
        newsletter.status = 'sent';
        newsletter.schedule.nextSendDate = null;
      }

      await newsletter.save();
    } catch (error) {
      console.error('Error sending scheduled newsletter:', error);
    }
  });
};

// Initialize scheduled newsletters on server start
const initializeScheduledNewsletters = async () => {
  try {
    const scheduledNewsletters = await Newsletter.find({
      status: 'scheduled',
      'schedule.nextSendDate': { $exists: true }
    });

    scheduledNewsletters.forEach(newsletter => {
      scheduleNewsletter(newsletter);
    });
  } catch (error) {
    console.error('Error initializing scheduled newsletters:', error);
  }
};

// Initialize scheduled newsletters
initializeScheduledNewsletters();

module.exports = router;

// End of newsletter.js
// Description: End of newsletter routes file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 