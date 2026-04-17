-- Kaila Feedback System - Database Schema
-- Run this migration to set up all tables

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin users table (linked to auth.users)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  full_name TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('emoji', 'choice', 'multi_choice', 'stars', 'open_text')),
  options JSONB, -- For choice/multi_choice: [{value: string, label: string, emoji?: string}]
  is_required BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Default questions that come with the system
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Survey sessions table
CREATE TABLE IF NOT EXISTS survey_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  device_info JSONB,
  source TEXT -- 'whatsapp', 'sms', 'qr', etc.
);

-- Responses table
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES survey_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_value TEXT, -- For emoji/choice/stars
  answer_values JSONB, -- For multi_choice
  answer_text TEXT, -- For open_text
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_questions_department ON questions(department_id);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(is_active, department_id);
CREATE INDEX IF NOT EXISTS idx_survey_sessions_department ON survey_sessions(department_id);
CREATE INDEX IF NOT EXISTS idx_survey_sessions_completed ON survey_sessions(is_completed, department_id);
CREATE INDEX IF NOT EXISTS idx_responses_session ON responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_question ON responses(question_id);

-- Enable Row Level Security
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for departments
CREATE POLICY "departments_select_all" ON departments FOR SELECT USING (true);
CREATE POLICY "departments_insert_super_admin" ON departments FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "departments_update_admin" ON departments FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND (role = 'super_admin' OR department_id = departments.id)));
CREATE POLICY "departments_delete_super_admin" ON departments FOR DELETE 
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'super_admin'));

-- RLS Policies for admin_users
CREATE POLICY "admin_users_select_own" ON admin_users FOR SELECT 
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "admin_users_insert_super_admin" ON admin_users FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "admin_users_update_own" ON admin_users FOR UPDATE 
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "admin_users_delete_super_admin" ON admin_users FOR DELETE 
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'super_admin'));

-- RLS Policies for questions
CREATE POLICY "questions_select_all" ON questions FOR SELECT USING (true);
CREATE POLICY "questions_insert_admin" ON questions FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() 
    AND (role = 'super_admin' OR department_id = questions.department_id)
  ));
CREATE POLICY "questions_update_admin" ON questions FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() 
    AND (role = 'super_admin' OR department_id = questions.department_id)
  ));
CREATE POLICY "questions_delete_admin" ON questions FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() 
    AND (role = 'super_admin' OR department_id = questions.department_id)
  ));

-- RLS Policies for survey_sessions (public can create, admins can view their department)
CREATE POLICY "survey_sessions_insert_public" ON survey_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "survey_sessions_update_public" ON survey_sessions FOR UPDATE USING (true);
CREATE POLICY "survey_sessions_select_admin" ON survey_sessions FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() 
    AND (role = 'super_admin' OR department_id = survey_sessions.department_id)
  ));

-- RLS Policies for responses (public can create, admins can view their department)
CREATE POLICY "responses_insert_public" ON responses FOR INSERT WITH CHECK (true);
CREATE POLICY "responses_select_admin" ON responses FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM admin_users au
    JOIN survey_sessions ss ON ss.department_id = au.department_id OR au.role = 'super_admin'
    WHERE au.id = auth.uid() AND ss.id = responses.session_id
  ));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
