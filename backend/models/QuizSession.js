const mongoose = require('mongoose');

const quizSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    userAnswer: {
      type: String
    },
    isCorrect: {
      type: Boolean
    },
    timeSpent: {
      type: Number // in seconds
    },
    points: {
      type: Number,
      default: 0
    },
    answeredAt: {
      type: Date
    }
  }],
  totalQuestions: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  incorrectAnswers: {
    type: Number,
    default: 0
  },
  totalScore: {
    type: Number,
    default: 0
  },
  maxPossibleScore: {
    type: Number,
    default: 0
  },
  percentageScore: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned', 'expired'],
    default: 'active'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  timeLimit: {
    type: Number,
    default: 300 // 5 minutes
  },
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    enum: ['general_knowledge', 'history', 'current_affairs', 'science', 'sports', 'entertainment', 'mixed']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'mixed'],
    default: 'mixed'
  },
  prizeEligible: {
    type: Boolean,
    default: false
  },
  prizeAwarded: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prize'
  },
  bonusMultiplier: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Indexes
quizSessionSchema.index({ user: 1, createdAt: -1 });
quizSessionSchema.index({ sessionId: 1 });
quizSessionSchema.index({ status: 1 });

// Virtual for duration
quizSessionSchema.virtual('duration').get(function() {
  if (this.endTime) {
    return Math.round((this.endTime - this.startTime) / 1000);
  }
  return Math.round((Date.now() - this.startTime) / 1000);
});

// Method to check if session is expired
quizSessionSchema.methods.isExpired = function() {
  const now = new Date();
  const sessionDuration = (now - this.startTime) / 1000;
  return sessionDuration > this.timeLimit;
};

// Method to get current question
quizSessionSchema.methods.getCurrentQuestion = function() {
  return this.questions[this.currentQuestionIndex];
};

// Method to answer current question
quizSessionSchema.methods.answerQuestion = function(answer, timeSpent) {
  const currentQuestion = this.questions[this.currentQuestionIndex];
  if (!currentQuestion) {
    throw new Error('No current question available');
  }

  currentQuestion.userAnswer = answer;
  currentQuestion.timeSpent = timeSpent;
  currentQuestion.answeredAt = new Date();

  // Check if answer is correct (this will be populated from Question model)
  const isCorrect = currentQuestion.isCorrect;
  currentQuestion.isCorrect = isCorrect;

  if (isCorrect) {
    this.correctAnswers += 1;
    // Calculate points with bonus for quick answers
    let points = currentQuestion.points || 10;
    if (timeSpent < 10) {
      points *= this.bonusMultiplier;
    }
    currentQuestion.points = points;
    this.totalScore += points;
  } else {
    this.incorrectAnswers += 1;
  }

  this.currentQuestionIndex += 1;

  // Check if quiz is completed
  if (this.currentQuestionIndex >= this.totalQuestions) {
    this.completeSession();
  }
};

// Method to complete session
quizSessionSchema.methods.completeSession = function() {
  this.status = 'completed';
  this.endTime = new Date();
  this.percentageScore = (this.correctAnswers / this.totalQuestions) * 100;
  
  // Check prize eligibility
  const minimumScore = process.env.MINIMUM_SCORE_FOR_PRIZE || 70;
  this.prizeEligible = this.percentageScore >= minimumScore;
};

// Method to abandon session
quizSessionSchema.methods.abandonSession = function() {
  this.status = 'abandoned';
  this.endTime = new Date();
  this.percentageScore = (this.correctAnswers / this.totalQuestions) * 100;
};

// Static method to get user's best score
quizSessionSchema.statics.getUserBestScore = function(userId) {
  return this.findOne({ 
    user: userId, 
    status: 'completed' 
  }).sort({ totalScore: -1 });
};

// Static method to get leaderboard
quizSessionSchema.statics.getLeaderboard = function(limit = 10, timeframe = 'all') {
  let matchCondition = { status: 'completed' };
  
  if (timeframe === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    matchCondition.createdAt = { $gte: today };
  } else if (timeframe === 'week') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    matchCondition.createdAt = { $gte: weekAgo };
  }

  return this.aggregate([
    { $match: matchCondition },
    { $group: {
        _id: '$user',
        bestScore: { $max: '$totalScore' },
        totalQuizzes: { $sum: 1 },
        avgScore: { $avg: '$totalScore' }
      }
    },
    { $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userDetails'
      }
    },
    { $unwind: '$userDetails' },
    { $project: {
        _id: 1,
        name: '$userDetails.name',
        phoneNumber: '$userDetails.phoneNumber',
        bestScore: 1,
        totalQuizzes: 1,
        avgScore: { $round: ['$avgScore', 2] }
      }
    },
    { $sort: { bestScore: -1 } },
    { $limit: limit }
  ]);
};

module.exports = mongoose.model('QuizSession', quizSessionSchema);