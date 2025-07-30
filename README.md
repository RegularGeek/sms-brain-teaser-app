# SMS Quiz Project - Complete Package

## 🎯 Overview
A complete SMS-based quiz application with Supabase database integration. This project includes everything you need to run a fully functional SMS quiz system.

## 📦 What's Included
- ✅ **Complete Backend** - Node.js server with Express
- ✅ **Supabase Schema** - Database setup for quiz questions
- ✅ **SMS Integration** - Twilio integration for SMS handling
- ✅ **Ready-to-Run** - All dependencies and configurations included
- ✅ **Documentation** - Complete setup and usage instructions

## 🚀 Quick Start

### 1. Download the Project
- Download `final_quiz_project.zip` from this repository
- Extract the zip file to your local machine

### 2. Set Up Supabase
1. Go to your Supabase dashboard
2. Open the SQL Editor
3. Copy and paste the contents of `supabase_questions_schema.sql`
4. Run the SQL to create your questions table

### 3. Configure Environment
1. Copy `backend/.env.example` to `backend/.env`
2. Fill in your Twilio and Supabase credentials

### 4. Install Dependencies
```bash
cd backend
npm install
```

### 5. Start the Server
```bash
npm start
```

## 📁 Project Structure
```
├── final_quiz_project.zip          # Complete project archive
├── supabase_questions_schema.sql   # Database schema
├── backend/                        # Node.js backend
│   ├── routes/                     # API routes
│   ├── services/                   # Business logic
│   ├── config/                     # Configuration files
│   └── package.json               # Dependencies
├── README.md                      # This file
└── QUICK_SETUP.md                # Detailed setup guide
```

## 🔧 Features
- **SMS Quiz System** - Send questions via SMS
- **Multiple Choice** - A, B, C answer options
- **Score Tracking** - Track user performance
- **Database Storage** - Supabase integration
- **Logging** - Comprehensive logging system

## 📞 SMS Commands
- `START` - Begin a new quiz session
- `A`, `B`, `C` - Answer questions
- `SCORE` - Check your current score
- `HELP` - Get available commands

## 🛠️ Technologies Used
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **SMS**: Twilio
- **Logging**: Winston

## 📖 Documentation
See `QUICK_SETUP.md` for detailed setup instructions and `backend/README.md` for backend-specific documentation.

## 🤝 Support
If you need help setting up or running the project, check the documentation files or create an issue in this repository.

---
**Ready to run your SMS quiz system! 🎉**
