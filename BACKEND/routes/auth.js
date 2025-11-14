// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../services/emailService');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isOnboarded: user.isOnboarded
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isOnboarded: user.isOnboarded,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Facebook OAuth Callback - UPDATED TO HANDLE MISSING EMAIL & FETCH PAGES
router.post('/facebook/callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }

    console.log('📝 Exchanging code for access token...');

    // Exchange code for access token
    const tokenResponse = await axios.get(
      'https://graph.facebook.com/v18.0/oauth/access_token',
      {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          redirect_uri: process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3000/onboarding',
          code: code
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log('✅ Access token obtained');

    // Get user info from Facebook (without email field since we don't have permission)
    const userInfoResponse = await axios.get(
      'https://graph.facebook.com/v18.0/me',
      {
        params: {
          fields: 'id,name,picture',
          access_token: accessToken
        }
      }
    );

    const fbUser = userInfoResponse.data;
    console.log('✅ User info retrieved:', fbUser.name);

    // Generate a placeholder email since we don't have email permission
    const email = `facebook_${fbUser.id}@temp.placeholder.com`;

    // Check if user exists by Facebook ID first, then by email
    let user = await User.findOne({ 
      $or: [
        { facebookId: fbUser.id },
        { email: email }
      ]
    });

    if (!user) {
      console.log('📝 Creating new user...');
      // Create new user with random password (not used for OAuth)
      user = await User.create({
        name: fbUser.name,
        email: email,
        facebookId: fbUser.id,
        profilePicture: fbUser.picture?.data?.url,
        isOnboarded: false,
        password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
      });
      console.log('✅ New user created');
    } else {
      console.log('✅ Existing user found');
      // Update existing user with Facebook info if not already set
      if (!user.facebookId) {
        user.facebookId = fbUser.id;
      }
      if (!user.profilePicture && fbUser.picture?.data?.url) {
        user.profilePicture = fbUser.picture.data.url;
      }
      await user.save();
    }

    // Fetch user's Facebook pages
    console.log('📝 Fetching Facebook pages...');
    let pages = [];
    try {
      const pagesResponse = await axios.get(
        'https://graph.facebook.com/v18.0/me/accounts',
        {
          params: {
            access_token: accessToken
          }
        }
      );
      pages = pagesResponse.data.data || [];
      console.log(`✅ Found ${pages.length} pages`);
    } catch (pageError) {
      console.error('⚠️ Error fetching pages:', pageError.message);
      // Continue without pages - user can connect later
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    console.log('✅ Facebook authentication successful');

    res.json({
      success: true,
      message: 'Facebook authentication successful',
      token,
      accessToken: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isOnboarded: user.isOnboarded,
        profilePicture: user.profilePicture
      },
      pages: pages
    });

  } catch (error) {
    console.error('❌ Facebook OAuth error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Facebook authentication failed',
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    try {
      // Send email
      await sendPasswordResetEmail(user.email, user.name, resetUrl);

      res.json({
        success: true,
        message: 'Password reset link sent to your email'
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      
      // Reset token fields if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent. Please try again later.'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      });
    }

    // Hash token to compare with database
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate new JWT token
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    res.json({
      success: true,
      message: 'Password reset successful',
      token: jwtToken
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Complete onboarding
router.post('/complete-onboarding', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { isOnboarded: true },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Onboarding completed',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get current user
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;