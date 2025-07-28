const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Question = require('../models/Question');
const QuizSession = require('../models/QuizSession');
const Prize = require('../models/Prize');
const smsService = require('../services/smsService');
const logger = require('../services/logger');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user.id);

    if (!user || !user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not verified'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// @route   POST /api/quiz/start
// @desc    Start a new quiz session
// @access  Private
router.post('/start', authenticateToken, [
  body('category').optional().isIn(['general_knowledge', 'history', 'current_affairs', 'science', 'sports', 'entertainment', 'mixed']),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard', 'mixed']),
  body('totalQuestions').optional().isInt({ min: 5, max: 20 })
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

    const user = req.user;

    // Check if user can attempt quiz today
    if (!user.canAttemptQuiz()) {
      return res.status(400).json({
        success: false,
        message: 'Daily quiz limit reached. Please try again tomorrow.',
        data: {
          dailyAttempts: user.dailyAttempts,
          maxAttempts: process.env.MAX_DAILY_ATTEMPTS || 3
        }
      });
    }

    const { 
      category = 'mixed', 
      difficulty = 'mixed', 
      totalQuestions = 10 
    } = req.body;

    // Get questions based on criteria
    let questions;
    if (category === 'mixed' && difficulty === 'mixed') {
      questions = await Question.getBalancedQuestions(totalQuestions);
    } else if (category === 'mixed') {
      questions = await Question.getRandomQuestions({ difficulty }, totalQuestions);
    } else if (difficulty === 'mixed') {
      questions = await Question.getRandomQuestions({ category }, totalQuestions);
    } else {
      questions = await Question.getRandomQuestions({ category, difficulty }, totalQuestions);
    }

    if (questions.length < totalQuestions) {
      return res.status(400).json({
        success: false,
        message: 'Not enough questions available for the selected criteria',
        data: {
          available: questions.length,
          requested: totalQuestions
        }
      });
    }

    // Create quiz session
    const sessionId = uuidv4();
    const quizSession = new QuizSession({
      sessionId,
      user: user._id,
      questions: questions.map(q => ({
        questionId: q._id,
        points: q.points || 10
      })),
      totalQuestions: questions.length,
      category,
      difficulty,
      timeLimit: process.env.QUIZ_SESSION_DURATION || 300, // 5 minutes
      maxPossibleScore: questions.reduce((sum, q) => sum + (q.points || 10), 0)
    });

    await quizSession.save();

    // Update user attempts
    user.incrementDailyAttempts();
    await user.save();

    // Mark questions as used
    await Promise.all(questions.map(q => {
      q.markAsUsed();
      return q.save();
    }));

    // Get first question details
    const firstQuestion = questions[0];
    
    logger.info(`Quiz session started for user ${user.phoneNumber}`, {
      sessionId,
      category,
      difficulty,
      totalQuestions: questions.length
    });

    res.json({
      success: true,
      message: 'Quiz session started successfully',
      data: {
        sessionId,
        totalQuestions: questions.length,
        timeLimit: quizSession.timeLimit,
        currentQuestionIndex: 0,
        category,
        difficulty,
        currentQuestion: {
          id: firstQuestion._id,
          question: firstQuestion.question,
          options: firstQuestion.options.map(opt => ({
            text: opt.text,
            id: opt._id
          })),
          timeLimit: firstQuestion.timeLimit,
          points: firstQuestion.points
        },
        maxPossibleScore: quizSession.maxPossibleScore
      }
    });
  } catch (error) {
    logger.error('Start quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/quiz/answer
// @desc    Submit answer for current question
// @access  Private
router.post('/answer', authenticateToken, [
  body('sessionId').notEmpty().withMessage('Session ID is required'),
  body('answer').notEmpty().withMessage('Answer is required'),
  body('timeSpent').optional().isInt({ min: 0 })
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

    const { sessionId, answer, timeSpent = 0 } = req.body;
    const user = req.user;

    // Find quiz session
    const session = await QuizSession.findOne({
      sessionId,
      user: user._id,
      status: 'active'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Quiz session not found or already completed'
      });
    }

    // Check if session is expired
    if (session.isExpired()) {
      session.status = 'expired';
      await session.save();
      
      return res.status(400).json({
        success: false,
        message: 'Quiz session has expired',
        data: {
          sessionStatus: 'expired'
        }
      });
    }

    // Get current question
    const currentQuestion = session.questions[session.currentQuestionIndex];
    if (!currentQuestion) {
      return res.status(400).json({
        success: false,
        message: 'No current question available'
      });
    }

    // Get question details to check answer
    const questionDetails = await Question.findById(currentQuestion.questionId);
    if (!questionDetails) {
      return res.status(400).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Check if answer is correct
    const isCorrect = questionDetails.correctAnswer === answer;
    
    // Update question statistics
    if (isCorrect) {
      questionDetails.correctAnswerCount += 1;
    } else {
      questionDetails.incorrectAnswerCount += 1;
    }
    await questionDetails.save();

    // Update current question in session
    currentQuestion.userAnswer = answer;
    currentQuestion.isCorrect = isCorrect;
    currentQuestion.timeSpent = timeSpent;
    currentQuestion.answeredAt = new Date();

    if (isCorrect) {
      session.correctAnswers += 1;
      // Calculate points with bonus for quick answers
      let points = questionDetails.points || 10;
      const bonusThreshold = 10; // seconds
      if (timeSpent < bonusThreshold && timeSpent > 0) {
        points *= (process.env.BONUS_MULTIPLIER || 2);
      }
      currentQuestion.points = points;
      session.totalScore += points;
    } else {
      session.incorrectAnswers += 1;
    }

    session.currentQuestionIndex += 1;

    // Check if quiz is completed
    if (session.currentQuestionIndex >= session.totalQuestions) {
      session.completeSession();
      
      // Update user statistics
      user.totalQuizzes += 1;
      user.totalScore += session.totalScore;
      await user.save();

      // Check for prize eligibility
      let prizeAwarded = null;
      if (session.prizeEligible) {
        try {
          const availablePrizes = await Prize.getAvailablePrizes(
            session.percentageScore, 
            session.totalQuestions,
            'daily'
          );

          if (availablePrizes.length > 0) {
            const prize = availablePrizes[0];
            if (prize.isEligibleForUser(user, session.percentageScore, session.totalQuestions)) {
              const claimCode = prize.awardToUser(user._id, session._id);
              await prize.save();
              
              session.prizeAwarded = prize._id;
              
              // Add prize to user
              user.prizesWon.push({
                prizeId: prize._id,
                dateWon: new Date(),
                claimed: false
              });
              await user.save();

              prizeAwarded = {
                name: prize.name,
                value: prize.value,
                type: prize.type,
                claimCode: claimCode
              };

              // Send prize notification SMS
              if (user.preferences.notifications) {
                try {
                  await smsService.sendPrizeNotification(
                    user.phoneNumber,
                    user.name || 'Player',
                    prize.name,
                    claimCode
                  );
                } catch (smsError) {
                  logger.error('Failed to send prize SMS:', smsError);
                }
              }
            }
          }
        } catch (prizeError) {
          logger.error('Prize awarding error:', prizeError);
        }
      }

      await session.save();

      // Send quiz completion SMS
      if (user.preferences.notifications) {
        try {
          await smsService.sendQuizResultNotification(
            user.phoneNumber,
            user.name || 'Player',
            session.correctAnswers,
            session.totalQuestions,
            prizeAwarded
          );
        } catch (smsError) {
          logger.error('Failed to send completion SMS:', smsError);
        }
      }

      logger.info(`Quiz completed for user ${user.phoneNumber}`, {
        sessionId,
        score: session.totalScore,
        percentage: session.percentageScore,
        prizeAwarded: !!prizeAwarded
      });

      return res.json({
        success: true,
        message: 'Quiz completed successfully',
        data: {
          sessionCompleted: true,
          finalScore: session.totalScore,
          correctAnswers: session.correctAnswers,
          totalQuestions: session.totalQuestions,
          percentageScore: session.percentageScore,
          isCorrect,
          correctAnswer: questionDetails.correctAnswer,
          explanation: questionDetails.explanation,
          prizeAwarded,
          canPlayAgain: user.canAttemptQuiz()
        }
      });
    } else {
      // Get next question
      const nextQuestionId = session.questions[session.currentQuestionIndex].questionId;
      const nextQuestion = await Question.findById(nextQuestionId);

      await session.save();

      res.json({
        success: true,
        message: 'Answer submitted successfully',
        data: {
          isCorrect,
          correctAnswer: questionDetails.correctAnswer,
          explanation: questionDetails.explanation,
          currentScore: session.totalScore,
          questionIndex: session.currentQuestionIndex,
          totalQuestions: session.totalQuestions,
          nextQuestion: {
            id: nextQuestion._id,
            question: nextQuestion.question,
            options: nextQuestion.options.map(opt => ({
              text: opt.text,
              id: opt._id
            })),
            timeLimit: nextQuestion.timeLimit,
            points: nextQuestion.points
          }
        }
      });
    }
  } catch (error) {
    logger.error('Submit answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/quiz/session/:sessionId
// @desc    Get quiz session details
// @access  Private
router.get('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const user = req.user;

    const session = await QuizSession.findOne({
      sessionId,
      user: user._id
    }).populate('questions.questionId', 'question options correctAnswer explanation');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Quiz session not found'
      });
    }

    res.json({
      success: true,
      message: 'Session details retrieved successfully',
      data: {
        session: {
          sessionId: session.sessionId,
          status: session.status,
          totalQuestions: session.totalQuestions,
          correctAnswers: session.correctAnswers,
          incorrectAnswers: session.incorrectAnswers,
          totalScore: session.totalScore,
          percentageScore: session.percentageScore,
          startTime: session.startTime,
          endTime: session.endTime,
          duration: session.duration,
          category: session.category,
          difficulty: session.difficulty,
          currentQuestionIndex: session.currentQuestionIndex,
          questions: session.questions.map((q, index) => ({
            questionIndex: index,
            question: q.questionId.question,
            options: q.questionId.options,
            userAnswer: q.userAnswer,
            correctAnswer: q.questionId.correctAnswer,
            isCorrect: q.isCorrect,
            timeSpent: q.timeSpent,
            points: q.points,
            explanation: q.questionId.explanation
          })),
          prizeEligible: session.prizeEligible,
          prizeAwarded: session.prizeAwarded
        }
      }
    });
  } catch (error) {
    logger.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/quiz/history
// @desc    Get user's quiz history
// @access  Private
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sessions = await QuizSession.find({ user: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('sessionId status totalScore percentageScore correctAnswers totalQuestions startTime endTime category difficulty prizeAwarded');

    const totalSessions = await QuizSession.countDocuments({ user: user._id });

    res.json({
      success: true,
      message: 'Quiz history retrieved successfully',
      data: {
        sessions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalSessions / limit),
          totalSessions,
          hasNext: page < Math.ceil(totalSessions / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('Get quiz history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/quiz/leaderboard
// @desc    Get leaderboard
// @access  Private
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'all'; // 'all', 'today', 'week'
    const limit = parseInt(req.query.limit) || 10;

    const leaderboard = await QuizSession.getLeaderboard(limit, timeframe);

    res.json({
      success: true,
      message: 'Leaderboard retrieved successfully',
      data: {
        leaderboard,
        timeframe,
        limit
      }
    });
  } catch (error) {
    logger.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/quiz/abandon
// @desc    Abandon current quiz session
// @access  Private
router.post('/abandon', authenticateToken, [
  body('sessionId').notEmpty().withMessage('Session ID is required')
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

    const { sessionId } = req.body;
    const user = req.user;

    const session = await QuizSession.findOne({
      sessionId,
      user: user._id,
      status: 'active'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Active quiz session not found'
      });
    }

    session.abandonSession();
    await session.save();

    logger.info(`Quiz abandoned by user ${user.phoneNumber}`, { sessionId });

    res.json({
      success: true,
      message: 'Quiz session abandoned',
      data: {
        sessionId,
        finalScore: session.totalScore,
        questionsAnswered: session.currentQuestionIndex,
        totalQuestions: session.totalQuestions
      }
    });
  } catch (error) {
    logger.error('Abandon quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;