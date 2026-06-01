-- ============================================
-- Migration 002: Multi-Tenancy
-- ============================================
-- Adds: schools, school_invites, phone_call_attempts tables
-- Modifies: users, calls, school_settings
-- Run this AFTER migration.sql in the Supabase SQL Editor.
-- This migration is idempotent and wrapped in a transaction.
-- ============================================

BEGIN;

-- ============================================
-- 1. Create schools table
-- ============================================
CREATE TABLE IF NOT EXISTS schools (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(64) UNIQUE,
  owner_user_id INTEGER, -- FK added after users backfill
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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_schools_updated') THEN
    CREATE TRIGGER trg_schools_updated
      BEFORE UPDATE ON schools
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ============================================
-- 2. Add school_id and phone_number to users
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS school_id INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(32);

-- Unique constraint on phone_number (allowing nulls)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_phone_number_unique'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_phone_number_unique UNIQUE (phone_number);
  END IF;
END $$;

-- ============================================
-- 3. Add school_id to calls (nullable initially)
-- ============================================
ALTER TABLE calls ADD COLUMN IF NOT EXISTS school_id INTEGER;

-- ============================================
-- 4. Seed Default School from existing school_settings (if any)
-- ============================================
DO $$
DECLARE
  default_school_id INTEGER;
  first_admin_id INTEGER;
  settings_school_name VARCHAR(255);
  settings_street_address VARCHAR(255);
  settings_city VARCHAR(100);
  settings_state VARCHAR(50);
  settings_zip_code VARCHAR(20);
  settings_intro_offer TEXT;
  settings_price_range_low INTEGER;
  settings_price_range_high INTEGER;
  settings_program_director_name VARCHAR(100);
  settings_additional_notes TEXT;
  found_settings BOOLEAN := FALSE;
BEGIN
  -- Pick the lowest-id user with role='admin' to become school_admin.
  -- Falls back to the lowest-id user overall.
  SELECT id INTO first_admin_id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1;
  IF first_admin_id IS NULL THEN
    SELECT id INTO first_admin_id FROM users ORDER BY id ASC LIMIT 1;
  END IF;

  -- Try to use existing settings as the default school (prefer the admin's)
  IF first_admin_id IS NOT NULL THEN
    SELECT
      school_name, street_address, city, state, zip_code,
      intro_offer, price_range_low, price_range_high,
      program_director_name, additional_notes
    INTO
      settings_school_name, settings_street_address, settings_city, settings_state, settings_zip_code,
      settings_intro_offer, settings_price_range_low, settings_price_range_high,
      settings_program_director_name, settings_additional_notes
    FROM school_settings WHERE user_id = first_admin_id LIMIT 1;
    IF FOUND THEN found_settings := TRUE; END IF;
  END IF;

  IF NOT found_settings THEN
    SELECT
      school_name, street_address, city, state, zip_code,
      intro_offer, price_range_low, price_range_high,
      program_director_name, additional_notes
    INTO
      settings_school_name, settings_street_address, settings_city, settings_state, settings_zip_code,
      settings_intro_offer, settings_price_range_low, settings_price_range_high,
      settings_program_director_name, settings_additional_notes
    FROM school_settings ORDER BY id ASC LIMIT 1;
    IF FOUND THEN found_settings := TRUE; END IF;
  END IF;

  -- Insert the default school using settings if present, otherwise blank
  INSERT INTO schools (
    name, slug, street_address, city, state, zip_code,
    intro_offer, price_range_low, price_range_high,
    program_director_name, additional_notes
  )
  VALUES (
    COALESCE(settings_school_name, 'Default School'),
    'default',
    settings_street_address,
    settings_city,
    settings_state,
    settings_zip_code,
    settings_intro_offer,
    settings_price_range_low,
    settings_price_range_high,
    settings_program_director_name,
    settings_additional_notes
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO default_school_id;

  -- If insert was skipped due to conflict, fetch the existing one
  IF default_school_id IS NULL THEN
    SELECT id INTO default_school_id FROM schools WHERE slug = 'default';
  END IF;

  -- Backfill ALL existing users into the default school
  UPDATE users SET school_id = default_school_id WHERE school_id IS NULL;

  -- Set the owner_user_id on the default school to the first admin
  IF first_admin_id IS NOT NULL THEN
    UPDATE schools SET owner_user_id = first_admin_id WHERE id = default_school_id;
  END IF;

  -- Backfill calls.school_id from users
  UPDATE calls
     SET school_id = u.school_id
    FROM users u
   WHERE calls.user_id = u.id AND calls.school_id IS NULL;
END $$;

-- ============================================
-- 5. Add foreign keys + NOT NULL constraints (post-backfill)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_school_id_fkey'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_school_id_fkey
      FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'calls_school_id_fkey'
  ) THEN
    ALTER TABLE calls
      ADD CONSTRAINT calls_school_id_fkey
      FOREIGN KEY (school_id) REFERENCES schools(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'schools_owner_user_id_fkey'
  ) THEN
    ALTER TABLE schools
      ADD CONSTRAINT schools_owner_user_id_fkey
      FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Apply NOT NULL to calls.school_id only if every row is populated
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM calls WHERE school_id IS NULL) THEN
    ALTER TABLE calls ALTER COLUMN school_id SET NOT NULL;
  END IF;
END $$;

-- ============================================
-- 6. Update users.role CHECK constraint
-- ============================================

-- We must drop ALL policies that reference users.role BEFORE altering the column type.
-- These will be recreated in step 10 below with the new role names.
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS calls_select ON calls;
DROP POLICY IF EXISTS calls_insert ON calls;
DROP POLICY IF EXISTS calls_update ON calls;
DROP POLICY IF EXISTS scorecards_select ON scorecards;
DROP POLICY IF EXISTS scorecards_insert ON scorecards;
DROP POLICY IF EXISTS school_settings_select ON school_settings;
DROP POLICY IF EXISTS school_settings_insert ON school_settings;
DROP POLICY IF EXISTS school_settings_update ON school_settings;

-- Widen role column so 'school_admin' / 'global_admin' fit (original was VARCHAR(10))
ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(20);

DO $$
BEGIN
  -- Drop old constraint if present
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;

  -- Map old roles to new roles
  -- 'admin' that is the owner of a school -> 'school_admin'
  -- 'admin' that is not an owner -> 'global_admin'
  -- 'user' -> 'staff'
  UPDATE users SET role = 'school_admin'
   WHERE role = 'admin'
     AND id IN (SELECT owner_user_id FROM schools WHERE owner_user_id IS NOT NULL);

  UPDATE users SET role = 'global_admin'
   WHERE role = 'admin';

  UPDATE users SET role = 'staff'
   WHERE role = 'user';

  -- Add new constraint
  ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('global_admin', 'school_admin', 'staff'));

  -- Update default for new users
  ALTER TABLE users ALTER COLUMN role SET DEFAULT 'staff';
END $$;

-- ============================================
-- 7. school_invites table
-- ============================================
CREATE TABLE IF NOT EXISTS school_invites (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  email VARCHAR(320) NOT NULL,
  role VARCHAR(16) NOT NULL DEFAULT 'staff'
    CHECK (role IN ('staff', 'school_admin')),
  token VARCHAR(64) NOT NULL UNIQUE,
  invited_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_active_invite_per_email_per_school
  ON school_invites (school_id, email)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_school_invites_token ON school_invites(token);

-- ============================================
-- 8. phone_call_attempts table (audit + rate limit log)
-- ============================================
CREATE TABLE IF NOT EXISTS phone_call_attempts (
  id SERIAL PRIMARY KEY,
  caller_number VARCHAR(32) NOT NULL,
  vapi_call_id VARCHAR(128),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
  outcome VARCHAR(20) NOT NULL
    CHECK (outcome IN ('accepted', 'rejected_unknown', 'rejected_rate_limit')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_attempts_number_created
  ON phone_call_attempts(caller_number, created_at DESC);

-- ============================================
-- 9. Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_calls_school_id ON calls(school_id);
CREATE INDEX IF NOT EXISTS idx_calls_school_created ON calls(school_id, created_at DESC);

-- ============================================
-- 10. Drop and recreate RLS policies (school-scoped)
-- ============================================

-- Enable RLS on new tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_call_attempts ENABLE ROW LEVEL SECURITY;

-- Drop old policies on existing tables (idempotent)
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS calls_select ON calls;
DROP POLICY IF EXISTS calls_insert ON calls;
DROP POLICY IF EXISTS calls_update ON calls;
DROP POLICY IF EXISTS scorecards_select ON scorecards;
DROP POLICY IF EXISTS scorecards_insert ON scorecards;
DROP POLICY IF EXISTS school_settings_select ON school_settings;
DROP POLICY IF EXISTS school_settings_insert ON school_settings;
DROP POLICY IF EXISTS school_settings_update ON school_settings;

-- Helper: get the current user's id and role from the JWT email
-- (We use inline subqueries below — no helper function needed.)

-- USERS policies
CREATE POLICY users_select ON users
  FOR SELECT USING (
    -- Self
    email = current_setting('request.jwt.claims', true)::json->>'email'
    -- Same school (any school_admin or staff in the same school can read)
    OR school_id IN (
      SELECT school_id FROM users
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
    -- Global admin sees all
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email'
        AND u.role = 'global_admin'
    )
  );

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (
    email = current_setting('request.jwt.claims', true)::json->>'email'
  );

-- SCHOOLS policies
CREATE POLICY schools_select ON schools
  FOR SELECT USING (
    id IN (
      SELECT school_id FROM users
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email'
        AND u.role = 'global_admin'
    )
  );

CREATE POLICY schools_update ON schools
  FOR UPDATE USING (
    id IN (
      SELECT school_id FROM users
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        AND role IN ('school_admin', 'global_admin')
    )
  );

CREATE POLICY schools_insert ON schools
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- CALLS policies (school-scoped)
CREATE POLICY calls_select ON calls
  FOR SELECT USING (
    -- Staff: own calls only
    user_id IN (
      SELECT id FROM users
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        AND role = 'staff'
    )
    -- School admin: all calls in their school
    OR school_id IN (
      SELECT school_id FROM users
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        AND role = 'school_admin'
    )
    -- Global admin: everything
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email'
        AND u.role = 'global_admin'
    )
  );

CREATE POLICY calls_insert ON calls
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM users
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY calls_update ON calls
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM users
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
    OR school_id IN (
      SELECT school_id FROM users
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        AND role IN ('school_admin', 'global_admin')
    )
  );

-- SCORECARDS policies (via call's school)
CREATE POLICY scorecards_select ON scorecards
  FOR SELECT USING (
    call_id IN (
      SELECT c.id FROM calls c
       JOIN users u ON u.id = c.user_id
       WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email'
    )
    OR call_id IN (
      SELECT c.id FROM calls c
       WHERE c.school_id IN (
         SELECT school_id FROM users
          WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
            AND role IN ('school_admin', 'global_admin')
       )
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

-- SCHOOL_SETTINGS policies (kept for now — settings are migrating to schools table)
-- These read/write through users.school_id
CREATE POLICY school_settings_select ON school_settings
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email'
        AND u.role IN ('school_admin', 'global_admin')
    )
  );

CREATE POLICY school_settings_insert ON school_settings
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM users
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY school_settings_update ON school_settings
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM users
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- SCHOOL_INVITES policies
CREATE POLICY school_invites_select ON school_invites
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM users
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        AND role IN ('school_admin', 'global_admin')
    )
  );

CREATE POLICY school_invites_insert ON school_invites
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM users
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        AND role IN ('school_admin', 'global_admin')
    )
  );

CREATE POLICY school_invites_update ON school_invites
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM users
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        AND role IN ('school_admin', 'global_admin')
    )
  );

CREATE POLICY school_invites_delete ON school_invites
  FOR DELETE USING (
    school_id IN (
      SELECT school_id FROM users
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        AND role IN ('school_admin', 'global_admin')
    )
  );

-- PHONE_CALL_ATTEMPTS policies (read-only for school admins, server writes via service role)
CREATE POLICY phone_call_attempts_select ON phone_call_attempts
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM users
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
        AND role IN ('school_admin', 'global_admin')
    )
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email'
        AND u.role = 'global_admin'
    )
  );

-- ============================================
-- Done
-- ============================================
COMMIT;
