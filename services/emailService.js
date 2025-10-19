const nodemailer = require('nodemailer');
const Subscriber = require('../models/Subscriber');
const User = require('../models/User');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

const sendNewsletter = async (newsletter) => {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('Email configuration incomplete. Skipping newsletter send.');
      return { total: 0, sent: 0, failed: 0, error: 'Email configuration incomplete' };
    }

    const transporter = createTransporter();
    const subscribers = await Subscriber.find();
    
    if (subscribers.length === 0) {
      throw new Error('No subscribers found');
    }

    const sentTo = [];
    const failedTo = [];

    for (const subscriber of subscribers) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: subscriber.email,
          subject: newsletter.subject,
          html: newsletter.content
        });
        sentTo.push({ email: subscriber.email, status: 'success', sentAt: new Date() });
      } catch (error) {
        console.error(`Failed to send to ${subscriber.email}:`, error.message);
        failedTo.push({ email: subscriber.email, status: 'failed', error: error.message, sentAt: new Date() });
      }
    }

    newsletter.status = 'sent';
    newsletter.sentAt = new Date();
    newsletter.sentTo = [...sentTo, ...failedTo];
    await newsletter.save();

    return { total: subscribers.length, sent: sentTo.length, failed: failedTo.length };
  } catch (error) {
    console.error('Error sending newsletter:', error.message);
    throw error;
  }
};

module.exports = { sendNewsletter };
