const mongoose = require('mongoose');

const prizeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  value: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  type: {
    type: String,
    enum: ['cash', 'voucher', 'product', 'discount', 'airtime', 'data'],
    required: true
  },
  category: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'special', 'consolation'],
    required: true
  },
  minimumScore: {
    type: Number,
    default: 70
  },
  minimumQuestions: {
    type: Number,
    default: 5
  },
  totalQuantity: {
    type: Number,
    required: true
  },
  remainingQuantity: {
    type: Number,
    required: true
  },
  distributionTime: {
    type: String, // e.g., "18:00" for 6 PM
    default: "18:00"
  },
  distributionDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  eligibilityCriteria: {
    minAge: {
      type: Number,
      default: 18
    },
    maxAge: {
      type: Number
    },
    location: [{
      type: String
    }],
    newUsersOnly: {
      type: Boolean,
      default: false
    }
  },
  claimInstructions: {
    type: String,
    trim: true
  },
  termsAndConditions: {
    type: String,
    trim: true
  },
  sponsor: {
    name: {
      type: String,
      trim: true
    },
    logo: {
      type: String // URL to logo
    },
    contact: {
      type: String
    }
  },
  winners: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuizSession'
    },
    dateWon: {
      type: Date,
      default: Date.now
    },
    claimed: {
      type: Boolean,
      default: false
    },
    claimedDate: {
      type: Date
    },
    claimCode: {
      type: String
    }
  }],
  image: {
    type: String // URL to prize image
  },
  priority: {
    type: Number,
    default: 1 // Higher number = higher priority
  }
}, {
  timestamps: true
});

// Indexes
prizeSchema.index({ category: 1, isActive: 1 });
prizeSchema.index({ minimumScore: 1 });
prizeSchema.index({ endDate: 1 });

// Virtual for availability
prizeSchema.virtual('isAvailable').get(function() {
  const now = new Date();
  return this.isActive && 
         this.remainingQuantity > 0 && 
         (!this.endDate || this.endDate > now) &&
         this.startDate <= now;
});

// Method to check if prize is available for user
prizeSchema.methods.isEligibleForUser = function(user, score, questionsAnswered) {
  if (!this.isAvailable) return false;
  
  // Check score requirement
  if (score < this.minimumScore) return false;
  
  // Check questions requirement
  if (questionsAnswered < this.minimumQuestions) return false;
  
  // Check if user has already won this prize
  const hasWon = this.winners.some(winner => 
    winner.user.toString() === user._id.toString()
  );
  
  if (hasWon && this.category !== 'daily') return false;
  
  // Check new users only
  if (this.eligibilityCriteria.newUsersOnly && user.totalQuizzes > 1) {
    return false;
  }
  
  return true;
};

// Method to award prize to user
prizeSchema.methods.awardToUser = function(userId, sessionId) {
  if (this.remainingQuantity <= 0) {
    throw new Error('Prize no longer available');
  }
  
  const claimCode = this.generateClaimCode();
  
  this.winners.push({
    user: userId,
    session: sessionId,
    claimCode: claimCode
  });
  
  this.remainingQuantity -= 1;
  
  return claimCode;
};

// Method to generate claim code
prizeSchema.methods.generateClaimCode = function() {
  const prefix = this.type.toUpperCase().substring(0, 2);
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `${prefix}${timestamp}${random}`;
};

// Method to claim prize
prizeSchema.methods.claimPrize = function(userId, claimCode) {
  const winner = this.winners.find(w => 
    w.user.toString() === userId.toString() && 
    w.claimCode === claimCode &&
    !w.claimed
  );
  
  if (!winner) {
    throw new Error('Invalid claim code or prize already claimed');
  }
  
  winner.claimed = true;
  winner.claimedDate = new Date();
  
  return winner;
};

// Static method to get available prizes for score
prizeSchema.statics.getAvailablePrizes = function(score, questionsAnswered, category = null) {
  const query = {
    isActive: true,
    remainingQuantity: { $gt: 0 },
    minimumScore: { $lte: score },
    minimumQuestions: { $lte: questionsAnswered },
    startDate: { $lte: new Date() },
    $or: [
      { endDate: { $exists: false } },
      { endDate: { $gt: new Date() } }
    ]
  };
  
  if (category) {
    query.category = category;
  }
  
  return this.find(query).sort({ priority: -1, value: -1 });
};

// Static method to get daily prizes
prizeSchema.statics.getDailyPrizes = function() {
  return this.find({
    category: 'daily',
    isActive: true,
    remainingQuantity: { $gt: 0 }
  }).sort({ priority: -1 });
};

module.exports = mongoose.model('Prize', prizeSchema);