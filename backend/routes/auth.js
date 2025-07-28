const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const smsService = require('../services/smsService');
const logger = require('../services/logger');

const router = express.Router();

// @route   POST /api/auth/send-otp
// @desc    Send OTP to phone number
// @access  Public
router.post('/send-otp', [
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .custom(value => {
      if (!smsService.isValidPhoneNumber(value)) {
        throw new Error('Invalid phone number format');
      }
      return true;
    })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { phoneNumber } = req.body;
    const formattedNumber = smsService.formatPhoneNumber(phoneNumber);

    // Generate verification code
    const verificationCode = smsService.generateVerificationCode();
    const expirationTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Find or create user
    let user = await User.findOne({ phoneNumber: formattedNumber });
    if (!user) {
      user = new User({
        phoneNumber: formattedNumber,
        isVerified: false
      });
    }

    // Update verification details
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = expirationTime;
    await user.save();

    // Send SMS
    try {
      const smsResult = await smsService.sendVerificationCode(formattedNumber, verificationCode);
      
      logger.info(`OTP sent to ${formattedNumber}`, { 
        userId: user._id, 
        provider: smsResult.provider 
      });

      res.json({
        success: true,
        message: 'Verification code sent successfully',
        data: {
          phoneNumber: formattedNumber,
          expiresIn: 300, // 5 minutes in seconds
          provider: smsResult.provider
        }
      });
    } catch (smsError) {
      logger.error(`Failed to send OTP to ${formattedNumber}:`, smsError);
      res.status(500).json({
        success: false,
        message: 'Failed to send verification code',
        error: smsError.message
      });
    }
  } catch (error) {
    logger.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and login user
// @access  Public
router.post('/verify-otp', [
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required'),
  body('verificationCode')
    .notEmpty()
    .withMessage('Verification code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Verification code must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { phoneNumber, verificationCode, name } = req.body;
    const formattedNumber = smsService.formatPhoneNumber(phoneNumber);

    // Find user
    const user = await User.findOne({ phoneNumber: formattedNumber });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check verification code
    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Check if code is expired
    if (user.verificationCodeExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired'
      });
    }

    // Update user details
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    user.lastLoginDate = new Date();
    
    if (name && !user.name) {
      user.name = name;
    }

    await user.save();

    // Generate JWT token
    const payload = {
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        isVerified: user.isVerified
      }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    logger.info(`User verified and logged in: ${formattedNumber}`, { userId: user._id });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          name: user.name,
          totalScore: user.totalScore,
          totalQuizzes: user.totalQuizzes,
          isVerified: user.isVerified,
          canAttemptQuiz: user.canAttemptQuiz(),
          dailyAttempts: user.dailyAttempts
        }
      }
    });
  } catch (error) {
    logger.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/auth/refresh-token
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh-token', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.user.id);

      if (!user || !user.isVerified) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }

      // Generate new token
      const payload = {
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          isVerified: user.isVerified
        }
      };

      const newToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: newToken,
          user: {
            id: user._id,
            phoneNumber: user.phoneNumber,
            name: user.name,
            totalScore: user.totalScore,
            totalQuizzes: user.totalQuizzes,
            isVerified: user.isVerified,
            canAttemptQuiz: user.canAttemptQuiz(),
            dailyAttempts: user.dailyAttempts
          }
        }
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user.id)
      .populate('prizesWon.prizeId', 'name value type claimed');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          name: user.name,
          totalScore: user.totalScore,
          totalQuizzes: user.totalQuizzes,
          isVerified: user.isVerified,
          canAttemptQuiz: user.canAttemptQuiz(),
          dailyAttempts: user.dailyAttempts,
          prizesWon: user.prizesWon,
          preferences: user.preferences,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('preferences.notifications').optional().isBoolean(),
  body('preferences.preferredCategories').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { name, preferences } = req.body;

    if (name) user.name = name;
    if (preferences) {
      if (preferences.notifications !== undefined) {
        user.preferences.notifications = preferences.notifications;
      }
      if (preferences.preferredCategories) {
        user.preferences.preferredCategories = preferences.preferredCategories;
      }
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          name: user.name,
          preferences: user.preferences
        }
      }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;