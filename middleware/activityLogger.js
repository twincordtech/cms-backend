/*
 * File: activityLogger.js
 * Description: Middleware for logging user activities and system events in the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const Activity = require('../models/Activity');

// Middleware to log user activities and system events
const activityLogger = async (req, res, next) => {
  try {
    // Skip logging for activity-related routes to prevent infinite loops
    if (req.path.startsWith('/api/activities')) {
      return next();
    }

    // Map HTTP methods to action types for activity logging
    const actionMap = {
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
      GET: 'view'
    };

    const action = actionMap[req.method];
    if (!action) {
      return next();
    }

    // Extract entity type from URL path
    const pathParts = req.path.split('/');
    let entity = pathParts[2] || 'system';
    
    // Map common entity types to standardized names
    const entityMap = {
      'auth': 'auth',
      'users': 'user',
      'leads': 'lead',
      'layouts': 'layout',
      'pages': 'page',
      'components': 'component',
      'notifications': 'notification',
      'blogs': 'blog',
      'newsletter': 'newsletter',
      'cms': 'cms',
      'admin': pathParts[3] || 'admin' // Handle admin routes
    };

    entity = entityMap[entity] || entity;

    // Extract entity ID if available in the URL
    let entityId = null;
    if (pathParts[3] && pathParts[3] !== 'all') {
      entityId = pathParts[3];
    }

    // Log activity only for authenticated users
    if (req.user) {
      // Build activity data object
      const activityData = {
        user: req.user._id,
        action,
        entity,
        entityId,
        details: {
          method: req.method,
          path: req.path,
          query: req.query,
          body: req.body,
          params: req.params
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'success'
      };

      // Special handling for page creation with additional details
      if (entity === 'page' && action === 'create') {
        activityData.details.title = req.body.title;
        activityData.details.slug = req.body.slug;
        activityData.details.status = req.body.status;
      }

      // Create and save activity log
      const activity = new Activity(activityData);
      await activity.save();
      
      // Log successful activity for debugging (removed for production cleanliness)
      // console.log('Activity logged successfully:', {
      //   user: req.user.email,
      //   action,
      //   entity,
      //   entityId,
      //   path: req.path
      // });
    } else {
      // Log unauthenticated requests for security monitoring (removed for production cleanliness)
      // console.log('Unauthenticated request:', {
      //   method: req.method,
      //   path: req.path,
      //   ip: req.ip
      // });
    }
  } catch (error) {
    // Log errors but don't block the request flow
    // console.error('Error logging activity:', error); // Removed for production cleanliness
  }

  next();
};

module.exports = activityLogger;

// End of activityLogger.js
// Description: End of activity logger middleware file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 