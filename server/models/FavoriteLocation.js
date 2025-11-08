const mongoose = require('mongoose');

const favoriteLocationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  label: {
    type: String,
    required: [true, 'Label is required'],
    enum: ['home', 'office', 'college', 'custom'],
    lowercase: true
  },
  customLabel: {
    type: String,
    trim: true,
    maxlength: [50, 'Custom label cannot be more than 50 characters']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [300, 'Address cannot be more than 300 characters']
  },
  latitude: {
    type: Number,
    required: false
  },
  longitude: {
    type: Number,
    required: false
  },
  emoji: {
    type: String,
    default: '📍'
  }
}, {
  timestamps: true
});

// Compound index to ensure user can only have one location per label
favoriteLocationSchema.index({ userId: 1, label: 1 }, { unique: true });

// Method to get display label
favoriteLocationSchema.methods.getDisplayLabel = function() {
  if (this.label === 'custom' && this.customLabel) {
    return this.customLabel;
  }
  return this.label.charAt(0).toUpperCase() + this.label.slice(1);
};

module.exports = mongoose.model('FavoriteLocation', favoriteLocationSchema);
