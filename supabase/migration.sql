-- ============================================
-- Supabase Migration for Call Trainer
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(320) NOT NULL UNIQUE,
  name TEXT,
  role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_signed_in TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Calls table
CREATE TABLE calls (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  scenario VARCHAR(30) NOT NULL DEFAULT 'new_student'
    CHECK (scenario IN ('new_student', 'parent_enrollment', 'web_lead_callback', 'sales_enrollment', 'renewal_conference', 'cancellation_save')),
  difficulty VARCHAR(10) NOT NULL DEFAULT 'medium'
    CHECK (difficulty IN ('easy', 'medium', 'hard')),
  vapi_call_id VARCHAR(128),
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'scoring', 'scored', 'failed')),
  duration_seconds INTEGER,
  recording_url TEXT,
  recording_sid VARCHAR(64),
  recording_s3_url TEXT,
  transcription TEXT,
  transcript_turns JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Scorecards table
CREATE TABLE scorecards (
  id SERIAL PRIMARY KEY,
  call_id INTEGER NOT NULL UNIQUE REFERENCES calls(id),
  overall_score REAL NOT NULL,
  categories JSONB NOT NULL,
  highlights JSONB NOT NULL,
  missed_opportunities JSONB NOT NULL,
  suggestions JSONB NOT NULL,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. School settings table
CREATE TABLE school_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  school_name VARCHAR(255) NOT NULL DEFAULT 'Our Martial Arts School',
  street_address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  intro_offer TEXT,
  price_range_low INTEGER,
  price_range_high INTEGER,
  program_director_name VARCHAR(100),
  additional_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_calls_user_id ON calls(user_id);
CREATE INDEX idx_calls_vapi_call_id ON calls(vapi_call_id);
CREATE INDEX idx_calls_created_at ON calls(created_at);
CREATE INDEX idx_scorecards_call_id ON scorecards(call_id);

-- ============================================
-- Auto-update updated_at trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_calls_updated
  BEFORE UPDATE ON calls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_school_settings_updated
  BEFORE UPDATE ON school_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;

-- Users: can read own row, admins can read all
CREATE POLICY users_select_own ON users
  FOR SELECT USING (
    email = current_setting('request.jwt.claims', true)::json->>'email'
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email'
      AND u.role = 'admin'
    )
  );

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (
    email = current_setting('request.jwt.claims', true)::json->>'email'
  );

-- Calls: users see own calls, admins see all
CREATE POLICY calls_select ON calls
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email'
      AND u.role = 'admin'
    )
  );

CREATE POLICY calls_insert ON calls
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  );

CREATE POLICY calls_update ON calls
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  );

-- Scorecards: accessible if the related call is accessible
CREATE POLICY scorecards_select ON scorecards
  FOR SELECT USING (
    call_id IN (
      SELECT c.id FROM calls c
      JOIN users u ON u.id = c.user_id
      WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email'
    )
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email'
      AND u.role = 'admin'
    )
  );

CREATE POLICY scorecards_insert ON scorecards
  FOR INSERT WITH CHECK (
    call_id IN (
      SELECT c.id FROM calls c
      JOIN users u ON u.id = c.user_id
      WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- School settings: users see/edit own, admins see all
CREATE POLICY school_settings_select ON school_settings
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email'
      AND u.role = 'admin'
    )
  );

CREATE POLICY school_settings_insert ON school_settings
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  );

CREATE POLICY school_settings_update ON school_settings
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  );

-- ============================================
-- Service role bypass (for server-side operations)
-- The service_role key bypasses RLS by default in Supabase
-- so server-side code using SUPABASE_SERVICE_ROLE_KEY
-- will have full access to all tables.
-- ============================================
