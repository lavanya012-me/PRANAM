// backend/config/facebook.js
module.exports = {
  appId: process.env.FACEBOOK_APP_ID,
  appSecret: process.env.FACEBOOK_APP_SECRET,
  redirectUri: process.env.FACEBOOK_REDIRECT_URI,
  apiVersion: 'v18.0',
  baseUrl: 'https://graph.facebook.com/v18.0',
  
  permissions: [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
    'pages_manage_engagement',
    'public_profile'
  ],

  getAuthUrl: function() {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      scope: this.permissions.join(','),
      response_type: 'code'
    });
    
    return `https://www.facebook.com/${this.apiVersion}/dialog/oauth?${params.toString()}`;
  }
};

