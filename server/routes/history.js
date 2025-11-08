const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const History = require('../models/History');

// Import authentication middleware
const { authenticateToken } = require('./auth');

// Add new history entry (protected - requires authentication)
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { source, destination, distance, duration } = req.body;
    const userId = req.user.userId;
    
    // Validate required fields
    if (!source || !destination) {
      return res.status(400).json({ 
        error: 'Source and destination are required' 
      });
    }

    // Extract numeric values from distance and duration strings
    const distanceValue = parseFloat(distance) || 0;
    const durationValue = parseFloat(duration) || 0;

    const entry = new History({
      userId,
      source: source.trim(),
      destination: destination.trim(),
      distance: distance || 'N/A',
      duration: duration || 'N/A',
      distanceValue,
      durationValue
    });
    
    await entry.save();
    
    console.log('History entry added:', entry);
    res.status(201).json({ 
      message: 'History saved successfully', 
      entry: entry.toJSON()
    });
  } catch (error) {
    console.error('Error adding history entry:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: errors.join(', ') 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to save history entry' 
    });
  }
});

// Get all history entries for authenticated user (protected)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const userHistory = await History.find({ userId })
      .sort({ timestamp: -1 })
      .limit(50); // Limit to last 50 entries
    
    res.status(200).json(userHistory);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch history' 
    });
  }
});

// Get history count for authenticated user (protected)
router.get('/count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await History.countDocuments({ userId });
    
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error getting history count:', error);
    res.status(500).json({ 
      error: 'Failed to get history count' 
    });
  }
});

// Get history statistics for authenticated user (protected)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Use MongoDB aggregation for efficient statistics calculation
    const stats = await History.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalComparisons: { $sum: 1 },
          totalDistance: { $sum: '$distanceValue' },
          averageDistance: { $avg: '$distanceValue' },
          totalDuration: { $sum: '$durationValue' },
          averageDuration: { $avg: '$durationValue' }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.status(200).json({
        totalComparisons: 0,
        averageDistance: 0,
        totalDistance: 0,
        averageDuration: 0,
        totalDuration: 0,
        mostFrequentSource: null,
        mostFrequentDestination: null,
        recentActivity: []
      });
    }

    const basicStats = stats[0];

    // Get most frequent locations
    const sourceStats = await History.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    const destStats = await History.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$destination', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    // Get recent activity
    const recentActivity = await History.find({ userId })
      .sort({ timestamp: -1 })
      .limit(5)
      .select('source destination distance duration timestamp');

    res.status(200).json({
      totalComparisons: basicStats.totalComparisons,
      averageDistance: Math.round(basicStats.averageDistance * 10) / 10,
      totalDistance: Math.round(basicStats.totalDistance * 10) / 10,
      averageDuration: Math.round(basicStats.averageDuration * 10) / 10,
      totalDuration: Math.round(basicStats.totalDuration * 10) / 10,
      mostFrequentSource: sourceStats.length > 0 ? sourceStats[0]._id : null,
      mostFrequentDestination: destStats.length > 0 ? destStats[0]._id : null,
      recentActivity
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ 
      error: 'Failed to get statistics' 
    });
  }
});

// Clear all history for authenticated user (protected)
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await History.deleteMany({ userId });
    
    res.status(200).json({ 
      message: 'History cleared successfully',
      removedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({ 
      error: 'Failed to clear history' 
    });
  }
});

// Search and filter history (protected) - Moved to end to avoid conflicts
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      query, 
      source, 
      destination, 
      minDistance, 
      maxDistance,
      startDate,
      endDate,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    // Build query object
    const queryObj = { userId };

    // Apply filters
    if (query) {
      queryObj.$or = [
        { source: { $regex: query, $options: 'i' } },
        { destination: { $regex: query, $options: 'i' } }
      ];
    }

    if (source) {
      queryObj.source = { $regex: source, $options: 'i' };
    }

    if (destination) {
      queryObj.destination = { $regex: destination, $options: 'i' };
    }

    if (minDistance || maxDistance) {
      queryObj.distanceValue = {};
      if (minDistance) queryObj.distanceValue.$gte = parseFloat(minDistance);
      if (maxDistance) queryObj.distanceValue.$lte = parseFloat(maxDistance);
    }

    if (startDate || endDate) {
      queryObj.timestamp = {};
      if (startDate) queryObj.timestamp.$gte = new Date(startDate);
      if (endDate) queryObj.timestamp.$lte = new Date(endDate);
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const userHistory = await History.find(queryObj)
      .sort(sortObj)
      .limit(100); // Limit search results

    res.status(200).json({
      results: userHistory,
      total: userHistory.length,
      filters: {
        query, source, destination, minDistance, maxDistance, startDate, endDate, sortBy, sortOrder
      }
    });
  } catch (error) {
    console.error('Error searching history:', error);
    res.status(500).json({ 
      error: 'Failed to search history' 
    });
  }
});

// Create sample data for demo user
const createSampleData = async () => {
  try {
    const demoUser = await require('../models/User').findOne({ email: 'demo@ridewise.com' });
    if (!demoUser) return;

    const existingHistory = await History.findOne({ userId: demoUser._id });
    if (existingHistory) return; // Sample data already exists

    const sampleData = [
      {
        userId: demoUser._id,
        source: "Mumbai Central",
        destination: "Bandra West",
        distance: "12.5 km",
        duration: "25 min",
        distanceValue: 12.5,
        durationValue: 25,
        timestamp: new Date('2024-01-15T10:30:00Z')
      },
      {
        userId: demoUser._id,
        source: "Andheri Station",
        destination: "Juhu Beach",
        distance: "8.2 km",
        duration: "18 min",
        distanceValue: 8.2,
        durationValue: 18,
        timestamp: new Date('2024-01-16T14:15:00Z')
      },
      {
        userId: demoUser._id,
        source: "Dadar Station",
        destination: "Worli Sea Face",
        distance: "15.3 km",
        duration: "32 min",
        distanceValue: 15.3,
        durationValue: 32,
        timestamp: new Date('2024-01-17T09:45:00Z')
      }
    ];

    await History.insertMany(sampleData);
    console.log('Sample history data created for demo user');
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
};

// Create sample data on startup
setTimeout(createSampleData, 2000); // Delay to ensure demo user is created first

module.exports = router;
