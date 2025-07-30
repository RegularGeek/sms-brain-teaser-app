-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(10),
    verification_code_expires TIMESTAMP WITH TIME ZONE,
    total_score INTEGER DEFAULT 0,
    total_quizzes_taken INTEGER DEFAULT 0,
    daily_attempts INTEGER DEFAULT 0,
    last_attempt_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    preferences JSONB DEFAULT '{"notifications": true, "preferred_categories": []}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer VARCHAR(255) NOT NULL,
    explanation TEXT,
    category VARCHAR(50) NOT NULL,
    difficulty_level VARCHAR(20) DEFAULT 'medium',
    points INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prizes table
CREATE TABLE IF NOT EXISTS prizes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    value DECIMAL(10,2),
    category VARCHAR(50),
    minimum_score INTEGER DEFAULT 70,
    is_active BOOLEAN DEFAULT TRUE,
    quantity_available INTEGER DEFAULT -1,
    quantity_claimed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_sessions table
CREATE TABLE IF NOT EXISTS quiz_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    score INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    time_taken INTEGER DEFAULT 0,
    category VARCHAR(50),
    difficulty_level VARCHAR(20),
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_prizes table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_prizes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    prize_id UUID REFERENCES prizes(id) ON DELETE CASCADE,
    date_won TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_answers table
CREATE TABLE IF NOT EXISTS quiz_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    user_answer VARCHAR(255),
    is_correct BOOLEAN,
    time_taken INTEGER,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(is_active);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_created_at ON quiz_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_prizes_user_id ON user_prizes(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_session_id ON quiz_answers(quiz_session_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prizes_updated_at BEFORE UPDATE ON prizes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quiz_sessions_updated_at BEFORE UPDATE ON quiz_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies - you may want to customize these)
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Questions are viewable by all" ON questions FOR SELECT USING (true);
CREATE POLICY "Questions can be managed by admins" ON questions FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Prizes are viewable by all" ON prizes FOR SELECT USING (true);
CREATE POLICY "Prizes can be managed by admins" ON prizes FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Users can view their own quiz sessions" ON quiz_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own quiz sessions" ON quiz_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quiz sessions" ON quiz_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own prizes" ON user_prizes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own prizes" ON user_prizes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own prizes" ON user_prizes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own quiz answers" ON quiz_answers FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM quiz_sessions 
        WHERE quiz_sessions.id = quiz_answers.quiz_session_id 
        AND quiz_sessions.user_id = auth.uid()
    )
);
CREATE POLICY "Users can insert their own quiz answers" ON quiz_answers FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM quiz_sessions 
        WHERE quiz_sessions.id = quiz_answers.quiz_session_id 
        AND quiz_sessions.user_id = auth.uid()
    )
);