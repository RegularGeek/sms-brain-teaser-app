const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String
  },
  verificationCodeExpires: {
    type: Date
  },
  totalScore: {
    type: Number,
    default: 0
  },
  totalQuizzes: {
    type: Number,
    default: 0
  },
  dailyAttempts: {
    type: Number,
    default: 0
  },
  lastAttemptDate: {
    type: Date
  },
  prizesWon: [{
    prizeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prize'
    },
    dateWon: {
      type: Date,
      default: Date.now
    },
    claimed: {
      type: Boolean,
      default: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginDate: {
    type: Date,
    default: Date.now
  },
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    preferredCategories: [{
      type: String,
      enum: ['general_knowledge', 'history', 'current_affairs', 'science', 'sports', 'entertainment']
    }]
  }
}, {
  timestamps: true
});

// Index for phone number lookup
userSchema.index({ phoneNumber: 1 });

// Method to check daily attempts
userSchema.methods.canAttemptQuiz = function() {
  const today = new Date();
  const lastAttempt = this.lastAttemptDate;
  
  if (!lastAttempt || lastAttempt.toDateString() !== today.toDateString()) {
    return true;
  }
  
  return this.dailyAttempts < process.env.MAX_DAILY_ATTEMPTS || 3;
};

// Method to reset daily attempts
userSchema.methods.resetDailyAttempts = function() {
  const today = new Date();
  const lastAttempt = this.lastAttemptDate;
  
  if (!lastAttempt || lastAttempt.toDateString() !== today.toDateString()) {
    this.dailyAttempts = 0;
    this.lastAttemptDate = today;
  }
};

// Method to increment daily attempts
userSchema.methods.incrementDailyAttempts = function() {
  this.resetDailyAttempts();
  this.dailyAttempts += 1;
  this.lastAttemptDate = new Date();
};

module.exports = mongoose.model('User', userSchema);