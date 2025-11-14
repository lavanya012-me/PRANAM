// backend/models/Audience.js
const mongoose = require('mongoose');

const audienceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  minAge: {
    type: Number,
    default: 18,
    min: 18
  },
  maxAge: {
    type: Number,
    default: 65,
    max: 65
  },
  gender: {
    type: String,
    enum: ['all', 'male', 'female'],
    default: 'all'
  },
  location: [String],
  interests: [String],
  language: {
    type: String,
    default: 'en'
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Audience', audienceSchema);
