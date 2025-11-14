// ===== backend/routes/user.js =====
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Get user profile
router.get('/profile', protect, async (req, res) => {
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

// Update profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email, profilePicture } = req.body;

    // Check if email is being changed and if it already exists
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, profilePicture },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Change password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);

    // Check if user signed up with Facebook (no password)
    if (user.facebookId && !currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Facebook login. Password change is not available.'
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update preferences
router.put('/preferences', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { preferences: req.body },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Complete onboarding
router.put('/complete-onboarding', protect, async (req, res) => {
  try {
    const { facebookPageId, facebookAccessToken, businessGoals } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        isOnboarded: true,
        facebookPageId,
        facebookAccessToken,
        businessGoals
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Disconnect Facebook account
router.post('/disconnect-facebook', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.facebookId) {
      return res.status(400).json({
        success: false,
        message: 'No Facebook account connected'
      });
    }

    // Remove Facebook data
    user.facebookId = undefined;
    user.facebookAccessToken = undefined;
    user.facebookPageId = undefined;
    
    await user.save();

    res.json({
      success: true,
      message: 'Facebook account disconnected successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get account info (including OAuth connections)
router.get('/account-info', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -facebookAccessToken');
    
    const accountInfo = {
      hasFacebookConnected: !!user.facebookId,
      isOnboarded: user.isOnboarded,
      email: user.email,
      name: user.name,
      profilePicture: user.profilePicture
    };

    res.json({
      success: true,
      accountInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete account
router.delete('/account', protect, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;