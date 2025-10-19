/*
 * File: activityController.js
 * Description: Handles activity log retrieval, filtering, and statistics for the CMS application.
 * Author: Tech4biz Solutions
 * Copyright: © Tech4biz Solutions Private
 */
const Activity = require('../models/Activity');

// Get all activities with pagination and filtering
exports.getActivities = async (req, res) => {
  try {
    // Log the incoming query for debugging
    // console.log('Fetching activities with query:', req.query); // Removed for production cleanliness
    
    const { 
      page = 1, 
      limit = 20, 
      user, 
      action, 
      entity, 
      startDate, 
      endDate,
      status,
      search
    } = req.query;
    
    // Build MongoDB filter object based on query params
    const filter = {};
    if (user) filter.user = user;
    if (action) filter.action = action;
    if (entity) filter.entity = entity;
    if (status) filter.status = status;
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Search filter for activity details
    if (search) {
      filter.$or = [
        { 'details.method': { $regex: search, $options: 'i' } },
        { 'details.path': { $regex: search, $options: 'i' } },
        { 'details.body': { $regex: search, $options: 'i' } }
      ];
    }

    // Query activities with pagination and user population
    const activities = await Activity.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('user', 'name email role');

    // Get total count for pagination
    const total = await Activity.countDocuments(filter);

    // Aggregate activity counts by action type
    const activityCounts = await Activity.aggregate([
      { $match: filter },
      { $group: { 
        _id: '$action', 
        count: { $sum: 1 } 
      }},
      { $sort: { count: -1 } }
    ]);

    // Respond with activities, pagination, and stats
    res.json({
      success: true,
      data: activities,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      },
      stats: {
        total,
        counts: activityCounts
      }
    });
  } catch (error) {
    // Handle and log errors
    // console.error('Get activities error:', error); // Removed for production cleanliness
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching activities',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get activities for a specific user with filtering and pagination
exports.getUserActivities = async (req, res) => {
  try {
    const { userId } = req.params;
    // console.log(`Fetching activities for user ${userId}`); // Removed for production cleanliness
    
    const { 
      page = 1, 
      limit = 20,
      action,
      entity,
      startDate,
      endDate,
      status
    } = req.query;

    // Build filter for user activities
    const filter = { user: userId };
    if (action) filter.action = action;
    if (entity) filter.entity = entity;
    if (status) filter.status = status;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Query user activities with pagination
    const activities = await Activity.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('user', 'name email role');

    // Get total count for pagination
    const total = await Activity.countDocuments(filter);

    // Aggregate user's activity counts by action type
    const activityCounts = await Activity.aggregate([
      { $match: filter },
      { $group: { 
        _id: '$action', 
        count: { $sum: 1 } 
      }},
      { $sort: { count: -1 } }
    ]);

    // Respond with user activities, pagination, and stats
    res.json({
      success: true,
      data: activities,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      },
      stats: {
        total,
        counts: activityCounts
      }
    });
  } catch (error) {
    // Handle and log errors
    // console.error('Get user activities error:', error); // Removed for production cleanliness
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user activities',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// End of activityController.js
// Description: End of activity controller file. Designed and developed by Tech4biz Solutions. Copyright © Tech4biz Solutions Private. 