# 🚀 Supabase Migration Guide

This guide will help you migrate your Brain Teaser Quiz application from MongoDB to Supabase.

## 📋 Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Node.js**: Version 16.0.0 or higher
3. **npm or yarn**: Package manager

## 🔧 Step-by-Step Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `brain-teaser-quiz`
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be created (2-3 minutes)

### 2. Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

### 3. Set Up Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your Supabase credentials:
   ```env
   # Supabase Configuration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   
   # Other configurations...
   ```

### 4. Install Dependencies

```bash
npm install
```

### 5. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `migrations/001_initial_schema.sql`
3. Paste and run the SQL in the Supabase SQL Editor
4. This will create all necessary tables and indexes

### 6. Seed the Database

```bash
node scripts/seedData.js
```

### 7. Test the Connection

```bash
npm run dev
```

Visit `http://localhost:5000/health` to verify the server is running.

## 🗄️ Database Schema

The migration includes the following tables:

- **users**: User accounts and profiles
- **questions**: Quiz questions with options and answers
- **prizes**: Available prizes and their requirements
- **quiz_sessions**: User quiz attempts and scores
- **user_prizes**: Many-to-many relationship for prizes won
- **quiz_answers**: Individual question responses

## 🔄 Key Changes from MongoDB

### 1. Connection
- **Before**: Mongoose with MongoDB URI
- **After**: Supabase client with URL and API key

### 2. Models
- **Before**: Mongoose schemas with methods
- **After**: Class-based models with static methods

### 3. Queries
- **Before**: Mongoose query methods
- **After**: Supabase query builder

### 4. Data Types
- **Before**: MongoDB ObjectId
- **After**: PostgreSQL UUID

## 🛠️ Development

### Running the Server
```bash
npm run dev
```

### Database Operations
```bash
# Seed data
node scripts/seedData.js

# View logs
tail -f logs/app.log
```

### Environment Variables
Make sure these are set in your `.env` file:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `TWILIO_ACCOUNT_SID` (if using Twilio)
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

## 🔒 Security Features

The migration includes:
- **Row Level Security (RLS)**: Data access control
- **JWT Authentication**: Secure user sessions
- **Rate Limiting**: API protection
- **Input Validation**: Data sanitization

## 🚨 Troubleshooting

### Common Issues

1. **Connection Error**: Check your Supabase URL and API keys
2. **Permission Denied**: Verify RLS policies are set correctly
3. **Missing Tables**: Run the migration SQL again
4. **Environment Variables**: Ensure all required vars are set

### Getting Help

1. Check Supabase logs in the dashboard
2. Review the application logs in `logs/app.log`
3. Verify your environment variables
4. Test the connection with a simple query

## 📊 Monitoring

- **Supabase Dashboard**: Monitor database performance
- **Application Logs**: Check `logs/app.log`
- **Health Endpoint**: `GET /health`

## 🔄 Migration Checklist

- [ ] Create Supabase project
- [ ] Get API credentials
- [ ] Set environment variables
- [ ] Install dependencies
- [ ] Run database migration
- [ ] Seed initial data
- [ ] Test connection
- [ ] Update application code
- [ ] Test all endpoints
- [ ] Deploy to production

## 🎉 Next Steps

After successful migration:
1. Update your frontend to use the new API
2. Test all quiz functionality
3. Monitor performance
4. Set up backups
5. Configure production environment

---

**Need help?** Check the main README.md for additional documentation or create an issue in the repository.