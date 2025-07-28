const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: [{
    text: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      default: false
    }
  }],
  correctAnswer: {
    type: String,
    required: true
  },
  explanation: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['general_knowledge', 'history', 'current_affairs', 'science', 'sports', 'entertainment']
  },
  subcategory: {
    type: String,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  points: {
    type: Number,
    default: 10
  },
  timeLimit: {
    type: Number,
    default: 30 // seconds
  },
  tags: [{
    type: String,
    trim: true
  }],
  country: {
    type: String,
    default: 'general' // for country-specific questions
  },
  source: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  correctAnswerCount: {
    type: Number,
    default: 0
  },
  incorrectAnswerCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  lastUsed: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
questionSchema.index({ category: 1, difficulty: 1 });
questionSchema.index({ isActive: 1 });
questionSchema.index({ country: 1 });

// Method to calculate success rate
questionSchema.methods.getSuccessRate = function() {
  const total = this.correctAnswerCount + this.incorrectAnswerCount;
  return total > 0 ? (this.correctAnswerCount / total) * 100 : 0;
};

// Method to mark question as used
questionSchema.methods.markAsUsed = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
};

// Static method to get random questions by criteria
questionSchema.statics.getRandomQuestions = function(criteria = {}, limit = 10) {
  const pipeline = [
    { $match: { isActive: true, ...criteria } },
    { $sample: { size: limit } }
  ];
  
  return this.aggregate(pipeline);
};

// Static method to get questions by difficulty distribution
questionSchema.statics.getBalancedQuestions = function(totalQuestions = 10, country = 'general') {
  const easyCount = Math.floor(totalQuestions * 0.3);
  const mediumCount = Math.floor(totalQuestions * 0.5);
  const hardCount = totalQuestions - easyCount - mediumCount;
  
  return Promise.all([
    this.getRandomQuestions({ difficulty: 'easy', country }, easyCount),
    this.getRandomQuestions({ difficulty: 'medium', country }, mediumCount),
    this.getRandomQuestions({ difficulty: 'hard', country }, hardCount)
  ]).then(([easy, medium, hard]) => {
    return [...easy, ...medium, ...hard].sort(() => Math.random() - 0.5);
  });
};

module.exports = mongoose.model('Question', questionSchema);