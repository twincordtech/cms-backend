/*
 * File: newsletterService.js
 * Description: Handles newsletter creation, scheduling, notifications, and admin alerts for the CMS application.
 * Design & Developed by: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private Limited
 */

const Newsletter = require('../models/Newsletter');
const User = require('../models/User');
const { createNewsletterNotification } = require('./notificationService');
const schedule = require('node-schedule');

// Store scheduled jobs for newsletters in memory
const scheduledJobs = new Map();

/**
 * Schedule a notification for a newsletter 10 minutes before its send time.
 * Cancels any existing scheduled job for the same newsletter.
 * @param {Object} newsletter - The newsletter document
 */
const scheduleNewsletterNotifications = async (newsletter) => {
  try {
    // Cancel existing job if any
    const existingJob = scheduledJobs.get(newsletter._id.toString());
    if (existingJob) {
      existingJob.cancel();
    }
    if (newsletter.status !== 'scheduled' || !newsletter.schedule.nextSendDate) {
      return;
    }
    // Schedule notification 10 minutes before newsletter send time
    const notificationTime = new Date(newsletter.schedule.nextSendDate);
    notificationTime.setMinutes(notificationTime.getMinutes() - 10);
    if (notificationTime <= new Date()) {
      return; // Don't schedule if the time has already passed
    }
    // Schedule the notification
    const job = schedule.scheduleJob(notificationTime, async () => {
      try {
        const adminUsers = await User.find({ role: 'admin' });
        await createNewsletterNotification(adminUsers, newsletter, 'upcoming');
        console.log(`Scheduled notification for newsletter: ${newsletter.subject}`);
      } catch (error) {
        console.error('Error sending newsletter notification:', error);
      }
    });
    // Store the job reference
    scheduledJobs.set(newsletter._id.toString(), job);
  } catch (error) {
    console.error('Error scheduling newsletter notification:', error);
  }
};

/**
 * Create a new newsletter and schedule notifications if needed.
 * @param {Object} newsletterData - Data for the new newsletter
 * @returns {Object} - The created newsletter document
 */
const createNewsletter = async (newsletterData) => {
  try {
    const newsletter = new Newsletter(newsletterData);
    await newsletter.save();
    // Schedule notification if newsletter is scheduled
    if (newsletter.status === 'scheduled') {
      await scheduleNewsletterNotifications(newsletter);
    }
    return newsletter;
  } catch (error) {
    console.error('Error creating newsletter:', error);
    throw error;
  }
};

/**
 * Update a newsletter and reschedule notifications if needed.
 * @param {String} id - The newsletter's MongoDB ID
 * @param {Object} updateData - Fields to update
 * @returns {Object} - The updated newsletter document
 */
const updateNewsletter = async (id, updateData) => {
  try {
    const newsletter = await Newsletter.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    if (!newsletter) {
      throw new Error('Newsletter not found');
    }
    // Reschedule notification if schedule changed
    if (newsletter.status === 'scheduled') {
      await scheduleNewsletterNotifications(newsletter);
    }
    return newsletter;
  } catch (error) {
    console.error('Error updating newsletter:', error);
    throw error;
  }
};

/**
 * Send a notification to all admins after a newsletter is sent.
 * @param {Object} newsletter - The newsletter document
 */
const sendNewsletterNotification = async (newsletter) => {
  try {
    const adminUsers = await User.find({ role: 'admin' });
    await createNewsletterNotification(adminUsers, newsletter, 'sent');
  } catch (error) {
    console.error('Error sending newsletter completion notification:', error);
  }
};

/**
 * Get all newsletters, optionally filtered.
 * @param {Object} filters - MongoDB query filters
 * @returns {Promise<Array>} - List of newsletters
 */
const getNewsletters = async (filters = {}) => {
  try {
    const newsletters = await Newsletter.find(filters)
      .sort({ createdAt: -1 });
    return newsletters;
  } catch (error) {
    console.error('Error fetching newsletters:', error);
    throw error;
  }
};

/**
 * Delete a newsletter and cancel any scheduled notifications.
 * @param {String} id - The newsletter's MongoDB ID
 * @returns {Object} - The deleted newsletter document
 */
const deleteNewsletter = async (id) => {
  try {
    // Cancel any scheduled notifications
    const existingJob = scheduledJobs.get(id);
    if (existingJob) {
      existingJob.cancel();
      scheduledJobs.delete(id);
    }
    const newsletter = await Newsletter.findByIdAndDelete(id);
    if (!newsletter) {
      throw new Error('Newsletter not found');
    }
    return newsletter;
  } catch (error) {
    console.error('Error deleting newsletter:', error);
    throw error;
  }
};

/**
 * Initialize scheduled notifications for all scheduled newsletters on server start.
 */
const initializeScheduledNotifications = async () => {
  try {
    const scheduledNewsletters = await Newsletter.find({
      status: 'scheduled',
      'schedule.nextSendDate': { $gt: new Date() }
    });
    for (const newsletter of scheduledNewsletters) {
      await scheduleNewsletterNotifications(newsletter);
    }
    console.log(`Initialized ${scheduledNewsletters.length} scheduled newsletter notifications`);
  } catch (error) {
    console.error('Error initializing scheduled notifications:', error);
  }
};

// Call this when your server starts
initializeScheduledNotifications();

module.exports = {
  createNewsletter,
  updateNewsletter,
  getNewsletters,
  deleteNewsletter,
  sendNewsletterNotification,
  scheduleNewsletterNotifications
};

/*
 * End of newsletterService.js
 * Description: End of newsletter service file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private Limited
 */ 