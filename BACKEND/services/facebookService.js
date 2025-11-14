// backend/services/facebookService.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const FB_API_VERSION = 'v21.0';
const FB_BASE_URL = `https://graph.facebook.com/${FB_API_VERSION}`;

// ==================== EXISTING POST PUBLISHING SERVICES ====================

exports.publishPost = async (pageId, pageAccessToken, postData) => {
  try {
    const { message, media, link } = postData;

    let endpoint = `${FB_BASE_URL}/${pageId}/feed`;
    let params = {
      message,
      access_token: pageAccessToken
    };

    if (link) {
      params.link = link;
    }

    const response = await axios.post(endpoint, null, { params });

    return {
      success: true,
      postId: response.data.id
    };
  } catch (error) {
    console.error('Facebook Publish Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to publish post');
  }
};

exports.schedulePost = async (pageId, pageAccessToken, postData, scheduledTime) => {
  try {
    const { message, media, link } = postData;

    // Convert scheduled time to Unix timestamp
    const publishTime = Math.floor(new Date(scheduledTime).getTime() / 1000);

    let params = {
      message,
      access_token: pageAccessToken,
      published: false,
      scheduled_publish_time: publishTime
    };

    if (link) {
      params.link = link;
    }

    const response = await axios.post(
      `${FB_BASE_URL}/${pageId}/feed`,
      null,
      { params }
    );

    return {
      success: true,
      postId: response.data.id
    };
  } catch (error) {
    console.error('Facebook Schedule Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to schedule post');
  }
};

exports.getPostInsights = async (postId, pageAccessToken) => {
  try {
    const response = await axios.get(
      `${FB_BASE_URL}/${postId}/insights`,
      {
        params: {
          metric: 'post_impressions,post_engaged_users,post_clicks,post_reactions_by_type_total',
          access_token: pageAccessToken
        }
      }
    );

    const insights = response.data.data;
    
    // Parse insights data
    const analytics = {
      impressions: 0,
      reach: 0,
      engagement: 0,
      clicks: 0,
      likes: 0,
      comments: 0,
      shares: 0
    };

    insights.forEach(metric => {
      switch (metric.name) {
        case 'post_impressions':
          analytics.impressions = metric.values[0]?.value || 0;
          break;
        case 'post_engaged_users':
          analytics.engagement = metric.values[0]?.value || 0;
          break;
        case 'post_clicks':
          analytics.clicks = metric.values[0]?.value || 0;
          break;
        case 'post_reactions_by_type_total':
          const reactions = metric.values[0]?.value || {};
          analytics.likes = reactions.like || 0;
          break;
      }
    });

    return analytics;
  } catch (error) {
    console.error('Facebook Insights Error:', error.response?.data || error.message);
    return null;
  }
};

exports.uploadPhoto = async (pageId, pageAccessToken, imageUrl) => {
  try {
    const response = await axios.post(
      `${FB_BASE_URL}/${pageId}/photos`,
      null,
      {
        params: {
          url: imageUrl,
          published: false,
          access_token: pageAccessToken
        }
      }
    );

    return response.data.id;
  } catch (error) {
    console.error('Facebook Upload Error:', error.response?.data || error.message);
    throw new Error('Failed to upload photo');
  }
};

// ==================== NEW: FACEBOOK ADS MANAGER SERVICES ====================

/**
 * Get long-lived access token
 */
exports.getLongLivedToken = async (shortToken) => {
  try {
    const response = await axios.get(
      `${FB_BASE_URL}/oauth/access_token`,
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          fb_exchange_token: shortToken
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting long-lived token:', error.response?.data);
    throw new Error('Failed to get long-lived token');
  }
};

/**
 * Get all ad accounts for user
 */
exports.getAdAccounts = async (accessToken) => {
  try {
    const response = await axios.get(
      `${FB_BASE_URL}/me/adaccounts`,
      {
        params: {
          access_token: accessToken,
          fields: 'id,name,account_status,currency,timezone_name,amount_spent,balance,business'
        }
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error getting ad accounts:', error.response?.data);
    throw new Error(error.response?.data?.error?.message || 'Failed to get ad accounts');
  }
};

/**
 * Upload image to Facebook Ads
 */
exports.uploadAdImage = async (accessToken, adAccountId, imagePath) => {
  try {
    const form = new FormData();
    form.append('access_token', accessToken);
    form.append('source', fs.createReadStream(imagePath));

    const response = await axios.post(
      `${FB_BASE_URL}/${adAccountId}/adimages`,
      form,
      {
        headers: form.getHeaders()
      }
    );
    
    const imageHash = Object.keys(response.data.images)[0];
    return response.data.images[imageHash].hash;
  } catch (error) {
    console.error('Error uploading ad image:', error.response?.data);
    throw new Error(error.response?.data?.error?.message || 'Failed to upload image');
  }
};

/**
 * Create Campaign
 */
exports.createCampaign = async (accessToken, adAccountId, campaignData) => {
  try {
    const { name, objective, status = 'PAUSED' } = campaignData;

    const response = await axios.post(
      `${FB_BASE_URL}/${adAccountId}/campaigns`,
      null,
      {
        params: {
          name,
          objective,
          status,
          special_ad_categories: [],
          access_token: accessToken
        }
      }
    );

    return {
      success: true,
      campaignId: response.data.id
    };
  } catch (error) {
    console.error('Campaign creation error:', error.response?.data);
    throw new Error(error.response?.data?.error?.message || 'Failed to create campaign');
  }
};

/**
 * Create Ad Set (Targeting & Budget)
 */
exports.createAdSet = async (accessToken, adAccountId, adSetData) => {
  try {
    const {
      campaignId,
      name,
      targeting,
      dailyBudget,
      startTime,
      endTime,
      optimizationGoal = 'REACH',
      billingEvent = 'IMPRESSIONS'
    } = adSetData;

    const response = await axios.post(
      `${FB_BASE_URL}/${adAccountId}/adsets`,
      null,
      {
        params: {
          name,
          campaign_id: campaignId,
          targeting: JSON.stringify(targeting),
          daily_budget: dailyBudget,
          billing_event: billingEvent,
          optimization_goal: optimizationGoal,
          bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
          status: 'PAUSED',
          start_time: startTime,
          ...(endTime && { end_time: endTime }),
          access_token: accessToken
        }
      }
    );

    return {
      success: true,
      adsetId: response.data.id
    };
  } catch (error) {
    console.error('Ad Set creation error:', error.response?.data);
    throw new Error(error.response?.data?.error?.message || 'Failed to create ad set');
  }
};

/**
 * Create Ad Creative
 */
exports.createAdCreative = async (accessToken, adAccountId, creativeData) => {
  try {
    const {
      pageId,
      name,
      message,
      imageHash,
      link,
      callToAction = 'LEARN_MORE'
    } = creativeData;

    const response = await axios.post(
      `${FB_BASE_URL}/${adAccountId}/adcreatives`,
      null,
      {
        params: {
          name,
          object_story_spec: JSON.stringify({
            page_id: pageId,
            link_data: {
              message,
              link,
              image_hash: imageHash,
              call_to_action: {
                type: callToAction,
                value: { link }
              }
            }
          }),
          access_token: accessToken
        }
      }
    );

    return {
      success: true,
      creativeId: response.data.id
    };
  } catch (error) {
    console.error('Creative creation error:', error.response?.data);
    throw new Error(error.response?.data?.error?.message || 'Failed to create creative');
  }
};

/**
 * Create Ad (Final step)
 */
exports.createAd = async (accessToken, adAccountId, adData) => {
  try {
    const {
      adsetId,
      creativeId,
      name,
      status = 'PAUSED'
    } = adData;

    const response = await axios.post(
      `${FB_BASE_URL}/${adAccountId}/ads`,
      null,
      {
        params: {
          name,
          adset_id: adsetId,
          creative: JSON.stringify({ creative_id: creativeId }),
          status,
          access_token: accessToken
        }
      }
    );

    return {
      success: true,
      adId: response.data.id
    };
  } catch (error) {
    console.error('Ad creation error:', error.response?.data);
    throw new Error(error.response?.data?.error?.message || 'Failed to create ad');
  }
};

/**
 * Create Complete Campaign (All-in-One)
 */
exports.createCompleteCampaign = async (accessToken, adAccountId, pageId, campaignData) => {
  try {
    console.log('📝 Starting complete campaign creation...');

    // Step 1: Create Campaign
    const campaign = await this.createCampaign(accessToken, adAccountId, {
      name: campaignData.name,
      objective: campaignData.objective
    });
    console.log('✓ Campaign created:', campaign.campaignId);

    // Step 2: Create Ad Set
    const adSet = await this.createAdSet(accessToken, adAccountId, {
      campaignId: campaign.campaignId,
      name: `${campaignData.name} - Ad Set`,
      targeting: campaignData.targeting,
      dailyBudget: campaignData.dailyBudget,
      startTime: campaignData.startTime
    });
    console.log('✓ Ad Set created:', adSet.adsetId);

    // Step 3: Create Ad Creative
    const creative = await this.createAdCreative(accessToken, adAccountId, {
      pageId,
      name: `${campaignData.name} - Creative`,
      message: campaignData.message,
      imageHash: campaignData.imageHash,
      link: campaignData.link,
      callToAction: campaignData.callToAction
    });
    console.log('✓ Creative created:', creative.creativeId);

    // Step 4: Create Ad
    const ad = await this.createAd(accessToken, adAccountId, {
      adsetId: adSet.adsetId,
      creativeId: creative.creativeId,
      name: `${campaignData.name} - Ad`
    });
    console.log('✓ Ad created:', ad.adId);

    return {
      success: true,
      data: {
        campaignId: campaign.campaignId,
        adsetId: adSet.adsetId,
        creativeId: creative.creativeId,
        adId: ad.adId
      },
      adsManagerUrl: `https://business.facebook.com/adsmanager/manage/campaigns?act=${adAccountId.replace('act_', '')}`
    };
  } catch (error) {
    console.error('Complete campaign creation error:', error);
    throw error;
  }
};

/**
 * Get Campaign Status & Insights
 */
exports.getCampaignStatus = async (accessToken, campaignId) => {
  try {
    const response = await axios.get(
      `${FB_BASE_URL}/${campaignId}`,
      {
        params: {
          access_token: accessToken,
          fields: 'id,name,status,objective,created_time,insights{impressions,clicks,spend,cpc,cpm,reach,frequency}'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Get campaign status error:', error.response?.data);
    throw new Error(error.response?.data?.error?.message || 'Failed to get campaign status');
  }
};

/**
 * Update Campaign Status
 */
exports.updateCampaignStatus = async (accessToken, campaignId, status) => {
  try {
    await axios.post(
      `${FB_BASE_URL}/${campaignId}`,
      null,
      {
        params: {
          status,
          access_token: accessToken
        }
      }
    );

    return {
      success: true,
      message: `Campaign ${status.toLowerCase()} successfully`
    };
  } catch (error) {
    console.error('Update campaign status error:', error.response?.data);
    throw new Error(error.response?.data?.error?.message || 'Failed to update campaign status');
  }
};

/**
 * Get All Campaigns
 */
exports.getAllCampaigns = async (accessToken, adAccountId) => {
  try {
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

    return response.data.data;
  } catch (error) {
    console.error('Get campaigns error:', error.response?.data);
    throw new Error(error.response?.data?.error?.message || 'Failed to get campaigns');
  }
};

/**
 * Get Campaign Insights (Detailed Analytics)
 */
exports.getCampaignInsights = async (accessToken, campaignId, datePreset = 'lifetime') => {
  try {
    const response = await axios.get(
      `${FB_BASE_URL}/${campaignId}/insights`,
      {
        params: {
          access_token: accessToken,
          fields: 'impressions,clicks,spend,reach,frequency,cpc,cpm,ctr,actions,action_values',
          date_preset: datePreset
        }
      }
    );

    return response.data.data[0] || {};
  } catch (error) {
    console.error('Get campaign insights error:', error.response?.data);
    throw new Error(error.response?.data?.error?.message || 'Failed to get campaign insights');
  }
};

/**
 * Delete Campaign
 */
exports.deleteCampaign = async (accessToken, campaignId) => {
  try {
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

    return {
      success: true,
      message: 'Campaign deleted successfully'
    };
  } catch (error) {
    console.error('Delete campaign error:', error.response?.data);
    throw new Error(error.response?.data?.error?.message || 'Failed to delete campaign');
  }
};

/**
 * Get Ad Account Balance and Spend
 */
exports.getAdAccountBalance = async (accessToken, adAccountId) => {
  try {
    const response = await axios.get(
      `${FB_BASE_URL}/${adAccountId}`,
      {
        params: {
          access_token: accessToken,
          fields: 'balance,amount_spent,currency,account_status'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Get ad account balance error:', error.response?.data);
    throw new Error(error.response?.data?.error?.message || 'Failed to get account balance');
  }
};