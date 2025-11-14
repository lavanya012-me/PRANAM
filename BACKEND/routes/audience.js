// backend/routes/audience.js
const express = require('express');
const router = express.Router();
const Audience = require('../models/Audience');
const { protect } = require('../middleware/auth');

// Create audience
router.post('/', protect, async (req, res) => {
  try {
    const audience = await Audience.create({
      userId: req.user.id,
      ...req.body
    });

    res.status(201).json({
      success: true,
      message: 'Audience created successfully',
      audience
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all audiences
router.get('/', protect, async (req, res) => {
  try {
    const audiences = await Audience.find({ userId: req.user.id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: audiences.length,
      audiences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get single audience
router.get('/:id', protect, async (req, res) => {
  try {
    const audience = await Audience.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!audience) {
      return res.status(404).json({
        success: false,
        message: 'Audience not found'
      });
    }

    res.json({
      success: true,
      audience
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update audience
router.put('/:id', protect, async (req, res) => {
  try {
    const audience = await Audience.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!audience) {
      return res.status(404).json({
        success: false,
        message: 'Audience not found'
      });
    }

    res.json({
      success: true,
      message: 'Audience updated successfully',
      audience
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete audience
router.delete('/:id', protect, async (req, res) => {
  try {
    const audience = await Audience.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!audience) {
      return res.status(404).json({
        success: false,
        message: 'Audience not found'
      });
    }

    res.json({
      success: true,
      message: 'Audience deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
