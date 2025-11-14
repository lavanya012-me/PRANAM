// backend/routes/facebook.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const FB_API_VERSION = 'v21.0';
const FB_BASE_URL = `https://graph.facebook.com/${FB_API_VERSION}`;

// ==================== OAUTH & PAGES ROUTES ====================

// Exchange code for access token - FIXED PATH
router.post('/auth/facebook/callback', protect, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }

    // Exchange code for access token
    const tokenResponse = await axios.get(`${FB_BASE_URL}/oauth/access_token`, {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
        code
      }
    });

    const accessToken = tokenResponse.data.access_token;

    // Get user info
    const userResponse = await axios.get(`${FB_BASE_URL}/me`, {
      params: {
        access_token: accessToken,
        fields: 'id,name,email'
      }
    });

    // Update user with Facebook credentials
    await User.findByIdAndUpdate(req.user.id, {
      facebookAccessToken: accessToken,
      facebookUserId: userResponse.data.id
    });

    res.json({
      success: true,
      message: 'Facebook account connected successfully',
      accessToken
    });
  } catch (error) {
    console.error('Facebook auth callback error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || error.message
    });
  }
});

// Get user's Facebook pages
router.get('/pages', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.facebookAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'Facebook account not connected'
      });
    }

    // Check if accessToken is provided in query (for frontend direct calls)
    const accessToken = req.query.accessToken || user.facebookAccessToken;

    const response = await axios.get(`${FB_BASE_URL}/me/accounts`, {
      params: {
        access_token: accessToken,
        fields: 'id,name,access_token,category,tasks'
      }
    });

    res.json({
      success: true,
      pages: response.data.data
    });
  } catch (error) {
    console.error('Get pages error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || error.message
    });
  }
});

// Select Facebook page
router.post('/pages/select', protect, async (req, res) => {
  try {
    const { pageId, pageName, pageAccessToken } = req.body;

    await User.findByIdAndUpdate(req.user.id, {
      selectedPageId: pageId,
      selectedPageName: pageName,
      pageAccessToken: pageAccessToken,
      isOnboarded: true
    });

    res.json({
      success: true,
      message: 'Facebook page selected successfully'
    });
  } catch (error) {
    console.error('Select page error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Disconnect Facebook
router.post('/disconnect', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      facebookAccessToken: '',
      facebookUserId: '',
      selectedPageId: '',
      selectedPageName: '',
      pageAccessToken: ''
    });

    res.json({
      success: true,
      message: 'Facebook account disconnected successfully'
    });
  } catch (error) {
    console.error('Disconnect error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== FACEBOOK ADS MANAGER ROUTES ====================

// Get Ad Accounts
router.get('/accounts', async (req, res) => {
  try {
    const { accessToken } = req.query;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const response = await axios.get(`${FB_BASE_URL}/me/adaccounts`, {
      params: {
        access_token: accessToken,
        fields: 'id,name,account_status,currency,timezone_name,amount_spent,balance'
      }
    });

    res.json({
      success: true,
      accounts: response.data.data
    });
  } catch (error) {
    console.error('Get ad accounts error:', error.response?.data);
    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || 'Failed to fetch ad accounts'
    });
  }
});

// Upload Image to Facebook
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    const { accessToken, adAccountId } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const form = new FormData();
    form.append('access_token', accessToken);
    form.append('source', fs.createReadStream(req.file.path));

    const response = await axios.post(
      `${FB_BASE_URL}/${adAccountId}/adimages`,
      form,
      {
        headers: {
          ...form.getHeaders()
        }
      }
    );

    // Delete uploaded file after successful upload to Facebook
    fs.unlinkSync(req.file.path);

    const imageHash = Object.keys(response.data.images)[0];
    const imageData = response.data.images[imageHash];

    res.json({
      success: true,
      imageHash: imageData.hash,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Image upload error:', error.response?.data);
    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || 'Failed to upload image'
    });
  }
});

// Create Complete Campaign (All-in-One)
router.post('/create-campaign', async (req, res) => {
  try {
    const {
      accessToken,
      adAccountId,
      pageId,
      campaignData
    } = req.body;

    console.log('Starting complete campaign creation...');

    // Validate required fields
    if (!accessToken || !adAccountId || !pageId || !campaignData) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Step 1: Create Campaign
    console.log('Creating campaign...');
    const campaignResponse = await axios.post(
      `${FB_BASE_URL}/${adAccountId}/campaigns`,
      null,
      {
        params: {
          name: campaignData.name,
          objective: campaignData.objective,
          status: 'PAUSED', // Always create as PAUSED for safety
          special_ad_categories: [],
          access_token: accessToken
        }
      }
    );
    const campaignId = campaignResponse.data.id;
    console.log('✓ Campaign created:', campaignId);

    // Step 2: Create Ad Set
    console.log('Creating ad set...');
    const adsetResponse = await axios.post(
      `${FB_BASE_URL}/${adAccountId}/adsets`,
      null,
      {
        params: {
          name: `${campaignData.name} - Ad Set`,
          campaign_id: campaignId,
          targeting: JSON.stringify(campaignData.targeting),
          daily_budget: campaignData.dailyBudget,
          billing_event: 'IMPRESSIONS',
          optimization_goal: 'REACH',
          bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
          status: 'PAUSED',
          start_time: campaignData.startTime,
          access_token: accessToken
        }
      }
    );
    const adsetId = adsetResponse.data.id;
    console.log('✓ Ad Set created:', adsetId);

    // Step 3: Create Ad Creative
    console.log('Creating ad creative...');
    const creativeResponse = await axios.post(
      `${FB_BASE_URL}/${adAccountId}/adcreatives`,
      null,
      {
        params: {
          name: `${campaignData.name} - Creative`,
          object_story_spec: JSON.stringify({
            page_id: pageId,
            link_data: {
              message: campaignData.message,
              link: campaignData.link,
              image_hash: campaignData.imageHash,
              call_to_action: {
                type: campaignData.callToAction || 'LEARN_MORE',
                value: { link: campaignData.link }
              }
            }
          }),
          access_token: accessToken
        }
      }
    );
    const creativeId = creativeResponse.data.id;
    console.log('✓ Creative created:', creativeId);

    // Step 4: Create Ad
    console.log('Creating ad...');
    const adResponse = await axios.post(
      `${FB_BASE_URL}/${adAccountId}/ads`,
      null,
      {
        params: {
          name: `${campaignData.name} - Ad`,
          adset_id: adsetId,
          creative: JSON.stringify({ creative_id: creativeId }),
          status: 'PAUSED',
          access_token: accessToken
        }
      }
    );
    const adId = adResponse.data.id;
    console.log('✓ Ad created:', adId);

    res.json({
      success: true,
      data: {
        campaignId,
        adsetId,
        creativeId,
        adId
      },
      message: 'Campaign created successfully! Check Meta Ads Manager.',
      adsManagerUrl: `https://business.facebook.com/adsmanager/manage/campaigns?act=${adAccountId.replace('act_', '')}`
    });
  } catch (error) {
    console.error('Complete campaign creation error:', error.response?.data);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || 'Failed to create campaign',
      details: error.response?.data
    });
  }
});

// Get Campaign Status & Insights
router.get('/campaign-status/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { accessToken } = req.query;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const response = await axios.get(
      `${FB_BASE_URL}/${campaignId}`,
      {
        params: {
          access_token: accessToken,
          fields: 'id,name,status,objective,created_time,insights{impressions,clicks,spend,cpc,cpm,reach,frequency}'
        }
      }
    );

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Get campaign status error:', error.response?.data);
    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || 'Failed to get campaign status'
    });
  }
});

// Update Campaign Status (Activate/Pause/Delete)
router.put('/campaign-status/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { accessToken, status } = req.body; // ACTIVE, PAUSED, DELETED

    if (!accessToken || !status) {
      return res.status(400).json({
        success: false,
        message: 'Access token and status are required'
      });
    }

    const response = await axios.post(
      `${FB_BASE_URL}/${campaignId}`,
      null,
      {
        params: {
          status: status,
          access_token: accessToken
        }
      }
    );

    res.json({
      success: true,
      message: `Campaign ${status.toLowerCase()} successfully`
    });
  } catch (error) {
    console.error('Update campaign status error:', error.response?.data);
    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || 'Failed to update campaign status'
    });
  }
});

// Get All Campaigns for Ad Account
router.get('/campaigns/:adAccountId', async (req, res) => {
  try {
    const { adAccountId } = req.params;
    const { accessToken } = req.query;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const response = await axios.get(
      `${FB_BASE_URL}/${adAccountId}/campaigns`,
      {
        params: {
          access_token: accessToken,
          fields: 'id,name,status,objective,created_time,insights{impressions,clicks,spend,reach}',
          limit: 50
        }
      }
    );

    res.json({
      success: true,
      campaigns: response.data.data
    });
  } catch (error) {
    console.error('Get campaigns error:', error.response?.data);
    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || 'Failed to fetch campaigns'
    });
  }
});

// Get Campaign Insights (Detailed Analytics)
router.get('/campaign-insights/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { accessToken, datePreset } = req.query;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const response = await axios.get(
      `${FB_BASE_URL}/${campaignId}/insights`,
      {
        params: {
          access_token: accessToken,
          fields: 'impressions,clicks,spend,reach,frequency,cpc,cpm,ctr,actions,action_values',
          date_preset: datePreset || 'lifetime'
        }
      }
    );

    res.json({
      success: true,
      insights: response.data.data[0] || {}
    });
  } catch (error) {
    console.error('Get campaign insights error:', error.response?.data);
    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || 'Failed to fetch campaign insights'
    });
  }
});

// Delete Campaign
router.delete('/campaign/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Update status to DELETED
    await axios.post(
      `${FB_BASE_URL}/${campaignId}`,
      null,
      {
        params: {
          status: 'DELETED',
          access_token: accessToken
        }
      }
    );

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Delete campaign error:', error.response?.data);
    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || 'Failed to delete campaign'
    });
  }
});

module.exports = router;