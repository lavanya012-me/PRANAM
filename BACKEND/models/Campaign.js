// backend/models/Campaign.js
const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  campaignName: {
    type: String,
    required: true,
    trim: true
  },
  pageName: {
    type: String,
    required: true
  },
  pageId: {
    type: String,
    required: true
  },
  objective: {
    type: String,
    enum: ['sales', 'engagement', 'leads', 'traffic', 'awareness'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  generatedContent: {
    postCopy: String,
    captions: [String],
    hashtags: [String]
  },
  adType: {
    type: String,
    enum: ['single_image', 'video', 'carousel'],
    required: true
  },
  media: [{
    type: String,
    url: String
  }],
  budget: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  schedule: {
    postDate: Date,
    postTime: String,
    timezone: String,
    frequency: {
      type: String,
      enum: ['once', 'daily', 'weekly'],
      default: 'once'
    },
    isScheduled: {
      type: Boolean,
      default: false
    }
  },
  audience: {
    minAge: { type: Number, default: 18 },
    maxAge: { type: Number, default: 65 },
    gender: {
      type: String,
      enum: ['all', 'male', 'female'],
      default: 'all'
    },
    location: [String],
    interests: [String],
    language: { type: String, default: 'en' }
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'completed', 'failed'],
    default: 'draft'
  },
  analytics: {
    impressions: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 }
  },
  facebookPostId: {
    type: String,
    default: ''
  },
  publishedAt: Date,
  completedAt: Date
}, {
  timestamps: true
});

// Index for efficient queries
campaignSchema.index({ userId: 1, status: 1 });
campaignSchema.index({ 'schedule.postDate': 1, 'schedule.isScheduled': 1 });

module.exports = mongoose.model('Campaign', campaignSchema);
