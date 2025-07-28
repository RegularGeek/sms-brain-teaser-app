# 🧠 Brain Teaser SMS Quiz Server

A comprehensive SMS-based quiz show server featuring brain teasers on general knowledge, history, and current affairs. Users can win amazing prizes by answering questions correctly via SMS authentication.

## 🚀 Features

### Core Features
- **SMS Authentication**: Secure login using phone numbers with OTP verification
- **Multi-Category Questions**: General knowledge, history, current affairs, science, sports, entertainment
- **Real-time Quiz Sessions**: Timed quiz sessions with instant scoring
- **Prize Management**: Automatic prize distribution based on performance
- **Leaderboards**: Daily, weekly, and all-time rankings
- **Daily Limits**: Configurable daily quiz attempt limits
- **Bonus System**: Extra points for quick correct answers

### Technical Features
- **RESTful API**: Clean, documented API endpoints
- **MongoDB Database**: Scalable NoSQL database with indexing
- **SMS Integration**: Support for Twilio and Termii SMS providers
- **Security**: Rate limiting, helmet protection, JWT authentication
- **Logging**: Comprehensive logging with Winston
- **Error Handling**: Graceful error handling and responses
- **Data Validation**: Input validation with express-validator

## 📋 Prerequisites

- Node.js (v16.0.0 or higher)
- MongoDB (v4.4 or higher)
- SMS Provider account (Twilio or Termii)
- npm or yarn package manager

## ⚙️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd brain-teaser-quiz/backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Copy the example environment file and configure it:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/brain_teaser_quiz

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# SMS Configuration (Choose one or both)
# Twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Termii (Alternative/Fallback)
TERMII_API_KEY=your_termii_api_key
TERMII_SENDER_ID=BrainQuiz

# Quiz Configuration
QUESTION_TIME_LIMIT=30
QUIZ_SESSION_DURATION=300
MAX_DAILY_ATTEMPTS=3
POINTS_PER_CORRECT_ANSWER=10
BONUS_MULTIPLIER=2
MINIMUM_SCORE_FOR_PRIZE=70
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# macOS with Homebrew
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Windows
net start MongoDB
```

### 5. Seed the Database
Populate the database with sample questions and prizes:
```bash
node scripts/seedData.js
```

### 6. Start the Server
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "phoneNumber": "+2348123456789"
}
```

#### Verify OTP & Login
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phoneNumber": "+2348123456789",
  "verificationCode": "123456",
  "name": "John Doe" // optional
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <jwt_token>
```

### Quiz Endpoints

#### Start Quiz Session
```http
POST /api/quiz/start
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "category": "mixed", // optional: general_knowledge, history, current_affairs, science, sports, entertainment, mixed
  "difficulty": "mixed", // optional: easy, medium, hard, mixed
  "totalQuestions": 10 // optional: 5-20
}
```

#### Submit Answer
```http
POST /api/quiz/answer
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "sessionId": "uuid-session-id",
  "answer": "Option A",
  "timeSpent": 15 // seconds
}
```

#### Get Quiz History
```http
GET /api/quiz/history?page=1&limit=10
Authorization: Bearer <jwt_token>
```

#### Get Leaderboard
```http
GET /api/quiz/leaderboard?timeframe=all&limit=10
Authorization: Bearer <jwt_token>
```

### Response Format
All API responses follow this structure:
```json
{
  "success": true|false,
  "message": "Response message",
  "data": {
    // Response data
  },
  "errors": [] // Only present when success is false
}
```

## 🏗️ Project Structure

```
backend/
├── config/
│   └── database.js          # Database connection
├── models/
│   ├── User.js              # User model
│   ├── Question.js          # Question model
│   ├── QuizSession.js       # Quiz session model
│   └── Prize.js             # Prize model
├── routes/
│   ├── auth.js              # Authentication routes
│   └── quiz.js              # Quiz routes
├── services/
│   ├── smsService.js        # SMS handling service
│   └── logger.js            # Logging service
├── scripts/
│   └── seedData.js          # Database seeding script
├── logs/                    # Log files
├── .env.example             # Environment variables template
├── package.json             # Dependencies and scripts
└── index.js                 # Main server file
```

## 🎮 Usage Examples

### 1. User Registration & Login Flow
```javascript
// 1. Send OTP
const otpResponse = await fetch('/api/auth/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phoneNumber: '+2348123456789' })
});

// 2. Verify OTP
const loginResponse = await fetch('/api/auth/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '+2348123456789',
    verificationCode: '123456',
    name: 'John Doe'
  })
});

const { token } = loginResponse.data;
```

### 2. Quiz Session Flow
```javascript
// 1. Start quiz
const startResponse = await fetch('/api/quiz/start', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    category: 'general_knowledge',
    difficulty: 'medium',
    totalQuestions: 10
  })
});

const { sessionId, currentQuestion } = startResponse.data;

// 2. Answer questions
const answerResponse = await fetch('/api/quiz/answer', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sessionId: sessionId,
    answer: 'Option B',
    timeSpent: 12
  })
});
```

## 🎁 Prize System

The server includes a sophisticated prize management system:

### Prize Categories
- **Daily**: Awarded daily for high-scoring participants
- **Weekly**: Awarded to top weekly performers
- **Monthly**: Special monthly prizes
- **Consolation**: For participation encouragement

### Prize Types
- **Cash**: Direct cash prizes
- **Airtime**: Mobile airtime credits
- **Data**: Internet data bundles
- **Vouchers**: Shopping or service vouchers
- **Products**: Physical products

### Prize Distribution
- Automatic prize eligibility checking
- SMS notifications for winners
- Claim code generation
- Prize tracking and analytics

## 🔒 Security Features

- **Rate Limiting**: API request limiting to prevent abuse
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive request validation
- **Helmet Security**: Security headers and protections
- **CORS Protection**: Controlled cross-origin access
- **SMS Verification**: Phone number verification for security

## 📊 Monitoring & Logging

### Log Files
- `logs/combined.log`: All application logs
- `logs/error.log`: Error logs only
- `logs/sms.log`: SMS operations tracking

### Health Check
```http
GET /health
```

Returns server status and configuration information.

## 🔧 Configuration Options

### Quiz Settings
- `QUESTION_TIME_LIMIT`: Time limit per question (seconds)
- `QUIZ_SESSION_DURATION`: Total quiz session duration (seconds)
- `MAX_DAILY_ATTEMPTS`: Maximum quiz attempts per day
- `POINTS_PER_CORRECT_ANSWER`: Base points for correct answers
- `BONUS_MULTIPLIER`: Multiplier for quick correct answers

### Prize Settings
- `MINIMUM_SCORE_FOR_PRIZE`: Minimum score percentage for prize eligibility
- `PRIZE_DISTRIBUTION_TIME`: Daily prize distribution time

### Security Settings
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window

## 🚀 Deployment

### Production Deployment
1. Set `NODE_ENV=production` in environment
2. Configure production MongoDB URI
3. Set up SMS provider credentials
4. Use PM2 or similar for process management:
```bash
npm install -g pm2
pm2 start index.js --name "brain-quiz-api"
```

### Docker Deployment
Create a `Dockerfile`:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

### Manual Testing
Use the seeded data to test the API:
1. Start the server with seeded data
2. Use a tool like Postman or curl to test endpoints
3. Test SMS functionality with real phone numbers

### Health Check
```bash
curl http://localhost:5000/health
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check MONGODB_URI in .env file
   - Verify network connectivity

2. **SMS Not Sending**
   - Verify SMS provider credentials
   - Check account balance for SMS provider
   - Review SMS service logs

3. **JWT Token Issues**
   - Ensure JWT_SECRET is set in environment
   - Check token expiration settings
   - Verify token format in requests

4. **Rate Limiting Issues**
   - Adjust rate limiting settings in .env
   - Check IP whitelisting if needed
   - Review rate limiting logs

### Debug Mode
Set log level to debug for detailed logging:
```env
LOG_LEVEL=debug
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please contact:
- Email: support@brainquiz.com
- Documentation: [API Docs]
- Issues: [GitHub Issues]

---

**Happy Quizzing! 🧠✨**