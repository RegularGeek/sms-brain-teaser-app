# 🚀 Quick Setup Guide - Brain Teaser SMS Quiz Server

## 📦 What's Included

This package contains a complete SMS-based quiz server with:
- **Authentication**: SMS OTP verification system
- **Quiz Engine**: Multi-category brain teasers 
- **Prize System**: Automatic prize distribution
- **Database**: MongoDB with sample data
- **SMS Integration**: Twilio/Termii support
- **API Documentation**: Complete REST API

## ⚡ Quick Start (5 minutes)

### 1. Prerequisites
```bash
# Install Node.js (v16+)
# Install MongoDB
# Get SMS provider credentials (Twilio or Termii)
```

### 2. Installation
```bash
# Extract the zip file
unzip brain-teaser-sms-quiz-complete.zip
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your SMS credentials
```

### 3. Database Setup
```bash
# Start MongoDB
mongod

# Seed with sample data (in another terminal)
node scripts/seedData.js
```

### 4. Start Server
```bash
npm start
# Server runs on http://localhost:5000
```

## 🔧 Configuration

### Required SMS Setup (Choose One)

**Twilio:**
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
SMS_PROVIDER=twilio
```

**Termii (Nigerian SMS):**
```env
TERMII_API_KEY=your_api_key
TERMII_SENDER_ID=BrainQuiz
SMS_PROVIDER=termii
```

### Optional Customization
```env
MAX_DAILY_ATTEMPTS=3
POINTS_PER_CORRECT_ANSWER=10
MINIMUM_SCORE_FOR_PRIZE=70
```

## 🧪 Test the API

### Health Check
```bash
curl http://localhost:5000/health
```

### Send OTP
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+2348123456789"}'
```

### Verify OTP & Login
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+2348123456789", "verificationCode": "123456"}'
```

### Start Quiz (with token)
```bash
curl -X POST http://localhost:5000/api/quiz/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category": "general_knowledge", "totalQuestions": 5}'
```

## 📊 Sample Data Included

- **14 Questions**: General knowledge, history, current affairs, science, sports, entertainment
- **5 Prizes**: Daily cash prizes, airtime, data bundles, weekly mega prize
- **Difficulty Levels**: Easy, medium, hard
- **Nigerian Context**: Local questions and prizes

## 🎁 Prize Categories

1. **Daily Cash Prize**: ₦5,000 (80%+ score)
2. **MTN Airtime**: ₦1,000 (70%+ score)  
3. **Data Bundle**: 1GB (60%+ score)
4. **Weekly Mega Prize**: ₦50,000 (top scorer)
5. **Consolation Prize**: ₦200 airtime (30%+ score)

## 📱 Features

✅ SMS Authentication  
✅ Real-time Quiz Sessions  
✅ Automatic Prize Distribution  
✅ Leaderboards  
✅ Daily Attempt Limits  
✅ Bonus Scoring System  
✅ Multi-category Questions  
✅ Prize Management  
✅ Comprehensive Logging  
✅ Rate Limiting & Security  

## 🔗 API Endpoints

- `POST /api/auth/send-otp` - Send verification code
- `POST /api/auth/verify-otp` - Verify & login
- `GET /api/auth/profile` - Get user profile
- `POST /api/quiz/start` - Start quiz session
- `POST /api/quiz/answer` - Submit answer
- `GET /api/quiz/history` - Quiz history
- `GET /api/quiz/leaderboard` - Top scores

## 📁 Project Structure

```
backend/
├── models/          # Database models
├── routes/          # API endpoints  
├── services/        # SMS, logging services
├── config/          # Database config
├── scripts/         # Database seeding
├── package.json     # Dependencies
├── index.js         # Main server
├── .env.example     # Environment template
└── README.md        # Full documentation
```

## 🆘 Troubleshooting

**MongoDB Connection Issues:**
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB
mongod --dbpath /data/db
```

**SMS Not Sending:**
- Verify SMS provider credentials
- Check account balance
- Test with valid phone numbers

**Server Won't Start:**
```bash
# Check for port conflicts
lsof -i :5000

# Kill existing processes
pkill -f "node index.js"
```

## 🌟 Next Steps

1. **Production Setup**: Configure production MongoDB, use PM2
2. **SSL Certificate**: Add HTTPS for production
3. **Admin Panel**: Build web interface for managing questions/prizes
4. **Analytics**: Add user engagement tracking
5. **Mobile App**: Create React Native frontend
6. **Scaling**: Add Redis for session management

## 📞 Support

- 📧 Email: support@brainquiz.com
- 📖 Full Docs: `/backend/README.md`
- 🐛 Issues: Check logs in `/backend/logs/`

---

**Happy Quizzing! 🧠✨**

*Built with Node.js, MongoDB, Express, and SMS integration*