/*
 * File: index.js
 * Description: Main server entry point for the CMS backend. Handles database connection, middleware, routes, rate limiting, error handling, and server startup.
 * Design & Developed by: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private Limited
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const rateLimit = require('express-rate-limit');
const path = require('path');
const componentRoutes = require('./routes/components');
const leadRoutes = require('./routes/leads');
const notificationRoutes = require('./routes/notifications');
const activityRoutes = require('./routes/activityRoutes');
const formRoutes = require('./routes/forms');
const activityLogger = require('./middleware/activityLogger');

// Connect to database
connectDB();

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware for parsing JSON, URL-encoded data, cookies, and logging activities
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(activityLogger);

/**
 * CORS configuration - Allow specific origins with credentials.
 * Only allows whitelisted origins in production, but is permissive in development.
 */
const allowedOrigins = [
  'https://cms.fentro.net',
  'https://cloudtopiaa.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:3000'
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/**
 * Rate limiters for different authentication routes to prevent brute-force attacks.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 login attempts per 15 minutes
  message: { success: false, message: 'Too many login attempts, please try again later.' }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 registration attempts per hour
  message: { success: false, message: 'Too many registration attempts, please try again later.' }
});

const generalAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: { success: false, message: 'Too many requests, please try again later.' }
});

// Apply rate limiters to specific routes in auth router
const authRouter = require('./routes/auth');
authRouter.use('/login', loginLimiter);
authRouter.use('/register', registerLimiter);
authRouter.use(generalAuthLimiter); // Apply to all other auth routes

// Register all API routes
app.use('/api/auth', authRouter);
app.use('/api/cms', require('./routes/cms'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/blogs', require('./routes/blogRoutes'));
app.use('/api/layouts', require('./routes/layouts'));
app.use('/api/cms/components', componentRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/forms', formRoutes);

/**
 * Debug route to check if server is working and to list available routes.
 */
app.get('/debug', (req, res) => {
  res.json({
    message: 'Server is running',
    routes: {
      leads: '/api/leads',
      test: '/api/leads/test',
      notifications: '/api/notifications'
    }
  });
});

// Serve uploaded files for media
app.use('/uploads/media', express.static(path.join(__dirname, 'uploads/media')));
app.use('/api/uploads/media', express.static(path.join(__dirname, 'uploads/media')));

/**
 * Health check route for uptime monitoring.
 */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

/**
 * Global error handling middleware for consistent error responses.
 */
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// Start server and log available routes
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Available routes:');
  console.log('- /api/auth/*');
  console.log('- /api/cms/*');
  console.log('- /api/blogs/*');
  console.log('- /api/layouts/*');
  console.log('- /api/leads/*');
  console.log('- /api/notifications/*');
  console.log('- /api/activities/*');
  console.log('- /debug (GET)');
  console.log('- /health (GET)');
  console.log('- /api/forms/');
});

/*
 * End of index.js
 * Description: End of main server entry file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private Limited
 */ 