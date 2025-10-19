/*
 * File: newsletters.js
 * Description: Express routes for advanced newsletter scheduling and management in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');
const auth = require('../middleware/auth');
const { sendNewsletter } = require('../services/emailService');
const cron = require('node-cron');

// Utility to sanitize string input
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[^a-zA-Z0-9_\-\s@.]/g, '').trim();
};

// Schedule newsletter
router.post('/:id/schedule', auth, async (req, res) => {
  try {
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

    // Parse time components
    const [hours, minutes] = scheduleTime.split(':').map(Number);
    
    // Set next send date based on frequency
    let nextSendDate = new Date(startDate);
    nextSendDate.setHours(hours, minutes, 0, 0);

    // If the scheduled time is in the past for today, move to next occurrence
    if (nextSendDate < new Date()) {
      switch (frequency) {
        case 'daily':
          nextSendDate.setDate(nextSendDate.getDate() + 1);
          break;
        case 'weekly':
          if (weekdays && weekdays.length > 0) {
            // Find next available weekday
            let found = false;
            let currentDate = new Date(nextSendDate);
            while (!found) {
              if (weekdays.includes(currentDate.getDay())) {
                found = true;
                nextSendDate = currentDate;
              } else {
                currentDate.setDate(currentDate.getDate() + 1);
              }
            }
          } else {
            nextSendDate.setDate(nextSendDate.getDate() + 7);
          }
          break;
        case 'monthly':
          if (monthlyConfig) {
            if (monthlyConfig.type === 'date') {
              nextSendDate.setDate(monthlyConfig.date);
              if (nextSendDate < new Date()) {
                nextSendDate.setMonth(nextSendDate.getMonth() + 1);
              }
            } else {
              // Handle specific day (e.g., last Friday)
              let targetDate = new Date(nextSendDate);
              targetDate.setDate(1); // Start from beginning of month
              
              if (monthlyConfig.week === -1) {
                // Last week
                targetDate.setMonth(targetDate.getMonth() + 1);
                targetDate.setDate(0);
                while (targetDate.getDay() !== monthlyConfig.day) {
                  targetDate.setDate(targetDate.getDate() - 1);
                }
              } else {
                // Specific week
                let found = false;
                let weekCount = 0;
                while (!found && targetDate.getMonth() === nextSendDate.getMonth()) {
                  if (targetDate.getDay() === monthlyConfig.day) {
                    weekCount++;
                    if (weekCount === monthlyConfig.week) {
                      found = true;
                      nextSendDate = new Date(targetDate);
                    }
                  }
                  targetDate.setDate(targetDate.getDate() + 1);
                }
              }
            }
          } else {
            nextSendDate.setMonth(nextSendDate.getMonth() + 1);
          }
          break;
        case 'custom':
          if (customDates && customDates.length > 0) {
            const futureDate = customDates.find(date => new Date(date) > new Date());
            if (futureDate) {
              nextSendDate = new Date(futureDate);
              nextSendDate.setHours(hours, minutes, 0, 0);
            }
          }
          break;
      }
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
  } catch (error) {
    console.error('Error scheduling newsletter:', error);
    res.status(500).json({ message: 'Error scheduling newsletter' });
  }
});

// Cancel schedule
router.post('/:id/cancel-schedule', auth, async (req, res) => {
  try {
    const newsletter = await Newsletter.findById(req.params.id);
    if (!newsletter) {
      return res.status(404).json({ message: 'Newsletter not found' });
    }

    newsletter.schedule = null;
    newsletter.status = 'draft';
    await newsletter.save();

    res.json({ 
      message: 'Schedule cancelled successfully',
      data: newsletter 
    });
  } catch (error) {
    console.error('Error cancelling schedule:', error);
    res.status(500).json({ message: 'Error cancelling schedule' });
  }
});

// Get scheduled newsletters
router.get('/scheduled', auth, async (req, res) => {
  try {
    const newsletters = await Newsletter.find({
      status: 'scheduled',
      'schedule.nextSendDate': { $exists: true }
    });
    res.json({ data: newsletters });
  } catch (error) {
    console.error('Error fetching scheduled newsletters:', error);
    res.status(500).json({ message: 'Error fetching scheduled newsletters' });
  }
});

// Get specific newsletter schedule
router.get('/:id/schedule', auth, async (req, res) => {
  try {
    const newsletter = await Newsletter.findById(req.params.id);
    if (!newsletter) {
      return res.status(404).json({ message: 'Newsletter not found' });
    }
    res.json({ data: newsletter.schedule });
  } catch (error) {
    console.error('Error fetching newsletter schedule:', error);
    res.status(500).json({ message: 'Error fetching newsletter schedule' });
  }
});

// Function to schedule newsletter sending
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

// Reschedule active newsletters on server start
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

// ... existing routes ...

module.exports = router;

// End of newsletters.js
// Description: End of newsletters routes file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 