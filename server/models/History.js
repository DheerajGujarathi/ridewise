const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  source: {
    type: String,
    required: [true, 'Source location is required'],
    trim: true,
    maxlength: [200, 'Source location cannot be more than 200 characters']
  },
  destination: {
    type: String,
    required: [true, 'Destination location is required'],
    trim: true,
    maxlength: [200, 'Destination location cannot be more than 200 characters']
  },
  distance: {
    type: String,
    required: [true, 'Distance is required'],
    trim: true
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    trim: true
  },
  distanceValue: {
    type: Number,
    default: 0
  },
  durationValue: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
historySchema.index({ userId: 1, timestamp: -1 });
historySchema.index({ userId: 1, source: 1 });
historySchema.index({ userId: 1, destination: 1 });

// Virtual for formatted date
historySchema.virtual('formattedDate').get(function() {
  return this.timestamp.toLocaleString();
});

// Ensure virtuals are included in JSON output
historySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('History', historySchema); 