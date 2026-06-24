-- ============================================================
-- Full schema — paste this into Supabase SQL Editor and run.
-- ============================================================

-- Auto-update trigger function (used by multiple tables)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS schools (
  id                    SERIAL PRIMARY KEY,
  name                  VARCHAR(255) NOT NULL,
  slug                  VARCHAR(64) UNIQUE,
  plan                  VARCHAR(64),
  owner_user_id         INTEGER,
  street_address        VARCHAR(255),
  city                  VARCHAR(100),
  state                 VARCHAR(50),
  zip_code              VARCHAR(20),
  intro_offer           TEXT,
  price_range_low       INTEGER,
  price_range_high      INTEGER,
  program_director_name VARCHAR(100),
  additional_notes      TEXT,
  usage_cap_usd         NUMERIC(10, 2),
  member_limit          INTEGER,
  monthly_roleplay_minutes INTEGER,
  usage_period_start    TIMESTAMPTZ,
  usage_period_end      TIMESTAMPTZ,
  archived_at           TIMESTAMPTZ,
  subscription_status   VARCHAR(20) NOT NULL DEFAULT 'active'
                           CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'suspended', 'canceled')),
  subscription_current_period_end TIMESTAMPTZ,
  access_grace_until    TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id               SERIAL PRIMARY KEY,
  email            VARCHAR(320) NOT NULL UNIQUE,
  name             TEXT,
  role             VARCHAR(20) NOT NULL DEFAULT 'staff'
                     CHECK (role IN ('staff', 'school_admin', 'global_admin')),
  avatar_url       TEXT,
  school_id        INTEGER REFERENCES schools(id) ON DELETE SET NULL,
  phone_number     VARCHAR(32) UNIQUE,
  supabase_auth_id UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_signed_in   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE schools
  ADD CONSTRAINT schools_owner_user_id_fkey
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS calls (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER NOT NULL REFERENCES users(id),
  school_id        INTEGER REFERENCES schools(id),
  scenario         VARCHAR(100) NOT NULL DEFAULT 'new_student',
  scenario_title   VARCHAR(255),
  difficulty       VARCHAR(10) NOT NULL DEFAULT 'medium'
                     CHECK (difficulty IN ('easy', 'medium', 'hard')),
  vapi_call_id     VARCHAR(128),
  status           VARCHAR(20) NOT NULL DEFAULT 'in_progress'
                     CHECK (status IN ('in_progress', 'completed', 'scoring', 'scored', 'failed')),
  duration_seconds INTEGER,
  recording_url    TEXT,
  recording_sid    VARCHAR(64),
  recording_s3_url TEXT,
  transcription    TEXT,
  transcript_turns JSONB,
  cost_usd         NUMERIC(10, 6),
  cost_breakdown   JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scorecards (
  id                  SERIAL PRIMARY KEY,
  call_id             INTEGER NOT NULL UNIQUE REFERENCES calls(id),
  overall_score       REAL NOT NULL,
  categories          JSONB NOT NULL,
  highlights          JSONB NOT NULL,
  missed_opportunities JSONB NOT NULL,
  suggestions         JSONB NOT NULL,
  summary             TEXT,
  prompt_tokens       INTEGER,
  completion_tokens   INTEGER,
  model               VARCHAR(64),
  cost_usd            NUMERIC(10, 6),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school_invites (
  id          SERIAL PRIMARY KEY,
  school_id   INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  email       VARCHAR(320) NOT NULL,
  full_name   TEXT,
  role        VARCHAR(16) NOT NULL DEFAULT 'staff'
                CHECK (role IN ('staff', 'school_admin', 'global_admin')),
  token       VARCHAR(64) NOT NULL UNIQUE,
  invited_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_events (
  id            SERIAL PRIMARY KEY,
  source        VARCHAR(50) NOT NULL,
  event_type    VARCHAR(100) NOT NULL,
  external_id   VARCHAR(255),
  payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
  status        VARCHAR(32) NOT NULL DEFAULT 'received'
                  CHECK (status IN ('received', 'processed', 'failed')),
  error_message TEXT,
  school_id     INTEGER REFERENCES schools(id) ON DELETE SET NULL,
  invite_id     INTEGER REFERENCES school_invites(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_scenarios (
  id               SERIAL PRIMARY KEY,
  slug             VARCHAR(100) NOT NULL,
  title            VARCHAR(255) NOT NULL,
  description      TEXT NOT NULL,
  context_type     VARCHAR(50) NOT NULL DEFAULT 'inbound_call',
  character_name   VARCHAR(100) NOT NULL,
  character_blurb  TEXT,
  topics           TEXT[],
  character_prompt TEXT NOT NULL,
  opening_line     TEXT,
  voice_id         VARCHAR(100) NOT NULL DEFAULT 'Elliot',
  voice_provider   VARCHAR(50) NOT NULL DEFAULT 'vapi',
  scoring_prompt   TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  school_id        INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  created_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS built_in_scenarios (
  slug               VARCHAR(100) PRIMARY KEY,
  title              VARCHAR(255) NOT NULL,
  description        TEXT NOT NULL,
  system_prompt_base TEXT,
  first_message      TEXT,
  voice_id           VARCHAR(100) NOT NULL DEFAULT 'Elliot',
  voice_provider     VARCHAR(50) NOT NULL DEFAULT 'vapi',
  scoring_rubric_type VARCHAR(40),
  scoring_categories JSONB,
  objection_focus     JSONB,
  objection_counts    JSONB,
  status             VARCHAR(20) NOT NULL DEFAULT 'published'
                       CHECK (status IN ('draft', 'published')),
  updated_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_settings (
  id                    INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  markup_percent        NUMERIC(5, 2) NOT NULL DEFAULT 0,
  default_llm_model     VARCHAR(64),
  default_usage_cap_usd NUMERIC(10, 2),
  maintenance_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  maintenance_message   TEXT,
  maintenance_severity  VARCHAR(16) NOT NULL DEFAULT 'info'
                          CHECK (maintenance_severity IN ('info', 'warning', 'critical')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_events (
  id          SERIAL PRIMARY KEY,
  source      VARCHAR(50) NOT NULL,
  event_type  VARCHAR(100) NOT NULL,
  severity    VARCHAR(20) NOT NULL DEFAULT 'error'
                CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  status      VARCHAR(20) NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'resolved')),
  message     TEXT NOT NULL,
  details     JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  school_id   INTEGER REFERENCES schools(id) ON DELETE SET NULL,
  call_id     INTEGER REFERENCES calls(id) ON DELETE SET NULL,
  external_id VARCHAR(255),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Seed the single platform_settings row
INSERT INTO platform_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Seed editable built-in scenario metadata. Runtime still falls back to code
-- defaults when system_prompt_base is null.
INSERT INTO built_in_scenarios
  (slug, title, description, first_message, voice_id, voice_provider, status)
VALUES
  (
    'new_student',
    'New Adult Student Inquiry',
    'Practice with Jordan, an adult who found you online and wants to get in shape. Handle cost, schedule, and commitment objections.',
    'Hey, I was just calling to get some info about your adult classes?',
    'Elliot',
    'vapi',
    'published'
  ),
  (
    'parent_enrollment',
    'Parent Enrolling a Child',
    'Practice with Sarah, a parent calling about enrolling her 7-year-old son. Address safety, discipline benefits, and schedule questions.',
    'Hi, yeah - I''m calling about your kids'' program? I''m thinking about enrolling my son.',
    'Emma',
    'vapi',
    'published'
  ),
  (
    'web_lead_callback',
    'Outbound Web Lead Callback',
    'Practice calling back Alex, a prospect who submitted a web form. Build rapport quickly, overcome skepticism, and book the appointment.',
    NULL,
    'Rohan',
    'vapi',
    'published'
  ),
  (
    'kids_web_lead_callback',
    'Kids Outbound Web Lead Callback',
    'Practice calling back Melissa, a parent who submitted a web form about kids classes for her daughter. Build trust, uncover goals, and book a low-pressure trial.',
    NULL,
    'Paige',
    'vapi',
    'published'
  ),
  (
    'sales_enrollment',
    'Sales Enrollment Conference',
    'Practice enrolling Jamie after a trial class. Follow the 4-step process: uncover goals, teach the benefit, pre-frame the upgrade, and present pricing.',
    'Yeah, the class was really good! I liked it.',
    'Nico',
    'vapi',
    'published'
  ),
  (
    'renewal_conference',
    'Renewal Conference',
    'Practice renewing Pat, a parent whose child has been training for 10 months. Ask the 3 Progress Check questions and present the renewal confidently.',
    'Yeah, Tyler''s been really enjoying it. I''m glad we tried it.',
    'Savannah',
    'vapi',
    'published'
  ),
  (
    'cancellation_save',
    'Cancellation Save',
    'Practice saving Morgan, a parent calling to cancel. Use the Universal Opening, identify the real reason, deploy the Extended Time Guarantee, and close.',
    'Hi, I''m calling because I need to cancel Cameron''s membership.',
    'Clara',
    'vapi',
    'published'
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_school_id         ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_supabase_auth_id  ON users(supabase_auth_id);
CREATE INDEX IF NOT EXISTS idx_calls_user_id           ON calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_school_id         ON calls(school_id);
CREATE INDEX IF NOT EXISTS idx_calls_school_created    ON calls(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_vapi_call_id      ON calls(vapi_call_id);
CREATE INDEX IF NOT EXISTS idx_schools_archived_at     ON schools(archived_at);
CREATE INDEX IF NOT EXISTS idx_schools_subscription_status ON schools(subscription_status);
CREATE INDEX IF NOT EXISTS idx_schools_usage_period_start ON schools(usage_period_start);
CREATE INDEX IF NOT EXISTS idx_scorecards_call_id      ON scorecards(call_id);
CREATE INDEX IF NOT EXISTS idx_school_invites_token    ON school_invites(token);
CREATE INDEX IF NOT EXISTS idx_custom_scenarios_school ON custom_scenarios(school_id);
CREATE INDEX IF NOT EXISTS idx_automation_events_source_created ON automation_events(source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_events_external ON automation_events(source, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_system_events_created ON system_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_events_status_created ON system_events(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_events_school_created ON system_events(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_events_call_id ON system_events(call_id);
CREATE INDEX IF NOT EXISTS idx_system_events_source_type ON system_events(source, event_type);

CREATE UNIQUE INDEX IF NOT EXISTS custom_scenarios_global_slug_unique
  ON custom_scenarios(slug)
  WHERE school_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS custom_scenarios_school_slug_unique
  ON custom_scenarios(school_id, slug)
  WHERE school_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_active_invite_per_email_per_school
  ON school_invites (school_id, email)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_school_invites_platform_open
  ON school_invites(email)
  WHERE school_id IS NULL AND accepted_at IS NULL AND revoked_at IS NULL;

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE TRIGGER trg_schools_updated
  BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_automation_events_updated
  BEFORE UPDATE ON automation_events FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_users_updated
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_calls_updated
  BEFORE UPDATE ON calls FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_custom_scenarios_updated
  BEFORE UPDATE ON custom_scenarios FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_built_in_scenarios_updated
  BEFORE UPDATE ON built_in_scenarios FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_platform_settings_updated
  BEFORE UPDATE ON platform_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- The backend uses the service role key which bypasses RLS.
-- These policies protect direct client-side access.
-- ============================================================

ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools           ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls             ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorecards        ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_invites    ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_scenarios  ENABLE ROW LEVEL SECURITY;
ALTER TABLE built_in_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;

-- USERS
CREATE POLICY users_select ON users FOR SELECT USING (
  email = current_setting('request.jwt.claims', true)::json->>'email'
  OR school_id IN (
    SELECT school_id FROM users
    WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  )
  OR EXISTS (
    SELECT 1 FROM users u
    WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email'
      AND u.role = 'global_admin'
  )
);
CREATE POLICY users_update_own ON users FOR UPDATE USING (
  email = current_setting('request.jwt.claims', true)::json->>'email'
);

-- SCHOOLS
CREATE POLICY schools_select ON schools FOR SELECT USING (
  id IN (SELECT school_id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  OR EXISTS (SELECT 1 FROM users u WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email' AND u.role = 'global_admin')
);
CREATE POLICY schools_insert ON schools FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users u WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email')
);
CREATE POLICY schools_update ON schools FOR UPDATE USING (
  id IN (SELECT school_id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email' AND role IN ('school_admin', 'global_admin'))
);

-- CALLS
CREATE POLICY calls_select ON calls FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email' AND role = 'staff')
  OR school_id IN (SELECT school_id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email' AND role = 'school_admin')
  OR EXISTS (SELECT 1 FROM users u WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email' AND u.role = 'global_admin')
);
CREATE POLICY calls_insert ON calls FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
);
CREATE POLICY calls_update ON calls FOR UPDATE USING (
  user_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  OR school_id IN (SELECT school_id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email' AND role IN ('school_admin', 'global_admin'))
);

-- SCORECARDS
CREATE POLICY scorecards_select ON scorecards FOR SELECT USING (
  call_id IN (SELECT c.id FROM calls c JOIN users u ON u.id = c.user_id WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email')
  OR call_id IN (SELECT c.id FROM calls c WHERE c.school_id IN (SELECT school_id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email' AND role IN ('school_admin', 'global_admin')))
);
CREATE POLICY scorecards_insert ON scorecards FOR INSERT WITH CHECK (false);

-- SCHOOL_INVITES
CREATE POLICY school_invites_select ON school_invites FOR SELECT USING (
  school_id IN (SELECT school_id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email' AND role IN ('school_admin', 'global_admin'))
);
CREATE POLICY school_invites_insert ON school_invites FOR INSERT WITH CHECK (false);
CREATE POLICY school_invites_update ON school_invites FOR UPDATE USING (false);
CREATE POLICY school_invites_delete ON school_invites FOR DELETE USING (false);

-- CUSTOM_SCENARIOS (read by all, writes via service role only)
CREATE POLICY custom_scenarios_select ON custom_scenarios FOR SELECT USING (true);
CREATE POLICY custom_scenarios_insert ON custom_scenarios FOR INSERT WITH CHECK (false);
CREATE POLICY custom_scenarios_update ON custom_scenarios FOR UPDATE USING (false);
CREATE POLICY custom_scenarios_delete ON custom_scenarios FOR DELETE USING (false);

-- BUILT_IN_SCENARIOS (read by all, writes via service role only)
CREATE POLICY built_in_scenarios_select ON built_in_scenarios FOR SELECT USING (true);
CREATE POLICY built_in_scenarios_insert ON built_in_scenarios FOR INSERT WITH CHECK (false);
CREATE POLICY built_in_scenarios_update ON built_in_scenarios FOR UPDATE USING (false);
CREATE POLICY built_in_scenarios_delete ON built_in_scenarios FOR DELETE USING (false);

-- PLATFORM_SETTINGS (read by all authenticated, writes via service role only)
CREATE POLICY platform_settings_select ON platform_settings FOR SELECT USING (
  EXISTS (SELECT 1 FROM users u WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email')
);
CREATE POLICY platform_settings_update ON platform_settings FOR UPDATE USING (false);

-- SYSTEM_EVENTS (global admin reads, writes via service role only)
CREATE POLICY system_events_select_global_admin ON system_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email'
      AND u.role IN ('global_admin', 'admin')
  )
);
CREATE POLICY system_events_insert_service_only ON system_events FOR INSERT WITH CHECK (false);
CREATE POLICY system_events_update_service_only ON system_events FOR UPDATE USING (false);
CREATE POLICY system_events_delete_service_only ON system_events FOR DELETE USING (false);
