/*
 * File: app.js
 * Description: Main Express application entry point for the CMS backend. Handles middleware, routes, error handling, and MongoDB connection.
 * Design & Developed by: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private Limited
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const cmsRoutes = require('./routes/cms');
const authRoutes = require('./routes/authRoutes');
const newsletterRoutes = require('./routes/newsletter');
const blogRoutes = require('./routes/blog');
const layoutRoutes = require('./routes/layouts');
const leadRoutes = require('./routes/leadRoutes');
const pagesRoutes = require('./routes/pages');
const pageInstanceRoutes = require('./routes/pageInstances');
const notificationRoutes = require('./routes/notificationRoutes');
const activityLogger = require('./middleware/activityLogger');
const activityRoutes = require('./routes/activityRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const { protect } = require('./middleware/auth');
const mediaRoutes = require('./routes/media');
const formsRoutes = require('./routes/forms');

dotenv.config();

const app = express();

/**
 * CORS configuration - Allow specific origins with credentials.
 * Only allows whitelisted origins in production, but is permissive in development.
 */
const allowedOrigins = [
  'https://cms.fentro.net',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:3000',
  // Add your Vercel deployment URL here after deployment
  // Example: 'https://your-app.vercel.app'
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [])
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Check if origin is in our allowed list
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.log('CORS blocked for:', origin);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.log('CORS preflight blocked for:', origin);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing and cookie parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Serve static files for media uploads
app.use('/uploads/media', express.static(path.join(__dirname, 'uploads/media')));

// Authentication middleware - applied after CORS and static file handling
app.use(protect);

// Activity logging middleware (after auth)
app.use(activityLogger);

// Register all API routes
app.use('/api/auth', authRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/cms', blogRoutes);
app.use('/api/layouts', layoutRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/cms/pages', pagesRoutes);
app.use('/api/cms/pages', pageInstanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/cms', mediaRoutes);
app.use('/api/forms', formsRoutes);

/**
 * Debug middleware to log all requests for development and troubleshooting.
 */
app.use((req, res, next) => {
  console.log('Request:', {
    method: req.method,
    url: req.url,
    body: req.body,
    headers: req.headers,
    user: req.user // Log user info for debugging
  });
  next();
});

/**
 * Global error handling middleware.
 * Catches all errors and sends a consistent error response.
 */
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

/**
 * 404 handler for unmatched routes.
 */
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.url);
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.url}`
  });
});

/**
 * Connect to MongoDB using Mongoose.
 */
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Available routes:');
  console.log('- /api/auth/*');
  console.log('- /api/leads/*');
  console.log('- /api/notifications/*');
});

module.exports = app;

/*
 * End of app.js
 * Description: End of main Express application file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private Limited
 */ 