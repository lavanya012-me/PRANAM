// backend/routes/campaigns.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Campaign = require('../models/Campaign');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const aiService = require('../services/aiService');
const facebookService = require('../services/facebookService');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// File filter to accept only images and videos
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images and videos are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: fileFilter
});

// Create campaign with media upload
router.post('/', protect, upload.single('media'), async (req, res) => {
  try {
    const {
      campaignName,
      pageName,
      pageId,
      objective,
      description,
      adType,
      budget,
      duration,
      generatedContent
    } = req.body;

    // Validate required fields
    if (!campaignName || !pageName || !description || !budget || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Prepare media URL if file was uploaded
    let mediaUrl = null;
    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
    }

    // Parse generatedContent if it's a string
    let parsedGeneratedContent = null;
    if (generatedContent) {
      try {
        parsedGeneratedContent = typeof generatedContent === 'string' 
          ? JSON.parse(generatedContent) 
          : generatedContent;
      } catch (e) {
        console.error('Error parsing generatedContent:', e);
      }
    }

    const campaign = await Campaign.create({
      userId: req.user.id,
      campaignName,
      pageName,
      pageId,
      objective,
      description,
      adType,
      media: mediaUrl,
      budget: Number(budget),
      duration: Number(duration),
      status: 'draft',
      generatedContent: parsedGeneratedContent
    });

    // Create notification
    await Notification.create({
      userId: req.user.id,
      type: 'campaign',
      title: 'Campaign Created',
      message: `Campaign "${campaignName}" has been created successfully`,
      campaignId: campaign._id
    });

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      campaign
    });
  } catch (error) {
    console.error('Campaign creation error:', error);
    
    // Delete uploaded file if campaign creation fails
    if (req.file) {
      const filePath = path.join(uploadsDir, req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Generate AI content
router.post('/generate-content', protect, async (req, res) => {
  try {
    const { description, objective, adType } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }

    const content = await aiService.generateCampaignContent(
      description,
      objective,
      adType
    );

    res.json({
      success: true,
      content
    });
  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all campaigns
router.get('/', protect, async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let query = { userId: req.user.id };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.campaignName = { $regex: search, $options: 'i' };
    }

    const campaigns = await Campaign.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: campaigns.length,
      campaigns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get single campaign
router.get('/:id', protect, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    res.json({
      success: true,
      campaign
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update campaign
router.put('/:id', protect, upload.single('media'), async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key === 'generatedContent' && typeof req.body[key] === 'string') {
        try {
          campaign[key] = JSON.parse(req.body[key]);
        } catch (e) {
          campaign[key] = req.body[key];
        }
      } else {
        campaign[key] = req.body[key];
      }
    });

    // Update media if new file uploaded
    if (req.file) {
      // Delete old media file if exists
      if (campaign.media) {
        const oldFilePath = path.join(__dirname, '..', campaign.media);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      campaign.media = `/uploads/${req.file.filename}`;
    }

    await campaign.save();

    res.json({
      success: true,
      message: 'Campaign updated successfully',
      campaign
    });
  } catch (error) {
    console.error('Campaign update error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Schedule campaign
router.post('/:id/schedule', protect, async (req, res) => {
  try {
    const { postDate, postTime, timezone, frequency } = req.body;

    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    campaign.schedule = {
      postDate,
      postTime,
      timezone,
      frequency,
      isScheduled: true
    };
    campaign.status = 'scheduled';

    await campaign.save();

    // Create notification
    await Notification.create({
      userId: req.user.id,
      type: 'campaign',
      title: 'Campaign Scheduled',
      message: `Campaign "${campaign.campaignName}" has been scheduled for ${postDate}`,
      campaignId: campaign._id
    });

    res.json({
      success: true,
      message: 'Campaign scheduled successfully',
      campaign
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete campaign
router.delete('/:id', protect, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Delete media file if exists
    if (campaign.media) {
      const filePath = path.join(__dirname, '..', campaign.media);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await campaign.deleteOne();

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get campaign analytics
router.get('/:id/analytics', protect, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Fetch analytics from Facebook if post is published
    if (campaign.facebookPostId) {
      const insights = await facebookService.getPostInsights(
        campaign.facebookPostId,
        req.user.pageAccessToken
      );
      
      if (insights) {
        campaign.analytics = insights;
        await campaign.save();
      }
    }

    res.json({
      success: true,
      analytics: campaign.analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;