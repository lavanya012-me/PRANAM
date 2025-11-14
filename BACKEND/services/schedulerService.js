// backend/services/schedulerService.js
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Notification = require('../models/Notification');
const facebookService = require('./facebookService');

exports.processScheduledCampaigns = async () => {
  try {
    const now = new Date();

    // Find campaigns scheduled for now (within 1 minute window)
    const campaigns = await Campaign.find({
      status: 'scheduled',
      'schedule.isScheduled': true,
      'schedule.postDate': {
        $lte: now,
        $gte: new Date(now.getTime() - 60000) // 1 minute ago
      }
    }).populate('userId');

    for (const campaign of campaigns) {
      try {
        const user = campaign.userId;

        if (!user.pageAccessToken) {
          throw new Error('Page access token not found');
        }

        // Prepare post data
        const postData = {
          message: `${campaign.generatedContent.postCopy}\n\n${campaign.generatedContent.captions.join(' ')}\n\n${campaign.generatedContent.hashtags.join(' ')}`,
          link: campaign.media[0]?.url || null
        };

        // Publish post
        const result = await facebookService.publishPost(
          campaign.pageId,
          user.pageAccessToken,
          postData
        );

        // Update campaign
        campaign.status = 'published';
        campaign.facebookPostId = result.postId;
        campaign.publishedAt = new Date();
        await campaign.save();

        // Create notification
        await Notification.create({
          userId: user._id,
          type: 'campaign',
          title: 'Campaign Published',
          message: `Campaign "${campaign.campaignName}" has been published successfully`,
          campaignId: campaign._id,
          priority: 'high'
        });

        console.log(`✅ Campaign ${campaign._id} published successfully`);
      } catch (error) {
        console.error(`❌ Failed to publish campaign ${campaign._id}:`, error.message);
        
        // Update campaign status
        campaign.status = 'failed';
        await campaign.save();

        // Create error notification
        await Notification.create({
          userId: campaign.userId._id,
          type: 'error',
          title: 'Campaign Failed',
          message: `Failed to publish campaign "${campaign.campaignName}": ${error.message}`,
          campaignId: campaign._id,
          priority: 'high'
        });
      }
    }
  } catch (error) {
    console.error('Schedule Service Error:', error);
  }
};
