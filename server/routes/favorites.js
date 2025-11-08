const express = require('express');
const router = express.Router();
const FavoriteLocation = require('../models/FavoriteLocation');
const { authenticateToken } = require('./auth');

// Get all favorite locations for authenticated user
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const favorites = await FavoriteLocation.find({ userId })
      .sort({ createdAt: 1 });
    
    res.status(200).json(favorites);
  } catch (error) {
    console.error('Error fetching favorite locations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch favorite locations' 
    });
  }
});

// Add or update a favorite location
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { label, customLabel, address, latitude, longitude, emoji } = req.body;
    const userId = req.user.userId;
    
    // Validate required fields
    if (!label || !address) {
      return res.status(400).json({ 
        error: 'Label and address are required' 
      });
    }

    // Validate label
    const validLabels = ['home', 'office', 'college', 'custom'];
    if (!validLabels.includes(label.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid label. Must be one of: home, office, college, custom' 
      });
    }

    // If custom label, ensure customLabel is provided
    if (label.toLowerCase() === 'custom' && !customLabel) {
      return res.status(400).json({ 
        error: 'Custom label text is required for custom locations' 
      });
    }

    // Check if favorite location with this label already exists
    const existing = await FavoriteLocation.findOne({ 
      userId, 
      label: label.toLowerCase() 
    });

    if (existing) {
      // Update existing favorite
      existing.address = address.trim();
      existing.latitude = latitude || existing.latitude;
      existing.longitude = longitude || existing.longitude;
      existing.emoji = emoji || existing.emoji;
      if (label.toLowerCase() === 'custom') {
        existing.customLabel = customLabel.trim();
      }
      
      await existing.save();
      
      return res.status(200).json({ 
        message: 'Favorite location updated successfully', 
        favorite: existing 
      });
    }

    // Create new favorite location
    const favorite = new FavoriteLocation({
      userId,
      label: label.toLowerCase(),
      customLabel: label.toLowerCase() === 'custom' ? customLabel.trim() : undefined,
      address: address.trim(),
      latitude,
      longitude,
      emoji: emoji || getDefaultEmoji(label.toLowerCase())
    });
    
    await favorite.save();
    
    res.status(201).json({ 
      message: 'Favorite location added successfully', 
      favorite 
    });
  } catch (error) {
    console.error('Error adding favorite location:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: errors.join(', ') 
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ 
        error: 'You already have a favorite location with this label' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to add favorite location' 
    });
  }
});

// Delete a favorite location
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const favoriteId = req.params.id;
    
    const favorite = await FavoriteLocation.findOne({ 
      _id: favoriteId, 
      userId 
    });
    
    if (!favorite) {
      return res.status(404).json({ 
        error: 'Favorite location not found' 
      });
    }
    
    await FavoriteLocation.deleteOne({ _id: favoriteId });
    
    res.status(200).json({ 
      message: 'Favorite location deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting favorite location:', error);
    res.status(500).json({ 
      error: 'Failed to delete favorite location' 
    });
  }
});

// Get a specific favorite location by label
router.get('/label/:label', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const label = req.params.label.toLowerCase();
    
    const favorite = await FavoriteLocation.findOne({ userId, label });
    
    if (!favorite) {
      return res.status(404).json({ 
        error: 'Favorite location not found' 
      });
    }
    
    res.status(200).json(favorite);
  } catch (error) {
    console.error('Error fetching favorite location:', error);
    res.status(500).json({ 
      error: 'Failed to fetch favorite location' 
    });
  }
});

// Helper function to get default emoji for label
function getDefaultEmoji(label) {
  const emojiMap = {
    'home': '🏠',
    'office': '🏢',
    'college': '🎓',
    'custom': '📍'
  };
  return emojiMap[label] || '📍';
}

module.exports = router;
