-- ============================================
-- Migration 002 Rollback: Multi-Tenancy
-- ============================================
-- WARNING: This will DESTROY data in:
--   - schools (entire table)
--   - school_invites (entire table)
--   - phone_call_attempts (entire table)
--   - users.school_id, users.phone_number columns
--   - calls.school_id column
-- It does NOT delete users, calls, scorecards, or school_settings rows.
-- It DOES revert the role enum from {global_admin, school_admin, staff}
-- back to {user, admin}.
-- ============================================

BEGIN;

-- ============================================
-- 1. Drop new RLS policies
-- ============================================
DROP POLICY IF EXISTS users_select ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS schools_select ON schools;
DROP POLICY IF EXISTS schools_update ON schools;
DROP POLICY IF EXISTS schools_insert ON schools;
DROP POLICY IF EXISTS calls_select ON calls;
DROP POLICY IF EXISTS calls_insert ON calls;
DROP POLICY IF EXISTS calls_update ON calls;
DROP POLICY IF EXISTS scorecards_select ON scorecards;
DROP POLICY IF EXISTS scorecards_insert ON scorecards;
DROP POLICY IF EXISTS school_settings_select ON school_settings;
DROP POLICY IF EXISTS school_settings_insert ON school_settings;
DROP POLICY IF EXISTS school_settings_update ON school_settings;
DROP POLICY IF EXISTS school_invites_select ON school_invites;
DROP POLICY IF EXISTS school_invites_insert ON school_invites;
DROP POLICY IF EXISTS school_invites_update ON school_invites;
DROP POLICY IF EXISTS school_invites_delete ON school_invites;
DROP POLICY IF EXISTS phone_call_attempts_select ON phone_call_attempts;

-- ============================================
-- 2. Drop foreign keys
-- ============================================
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_school_id_fkey;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_number_unique;
ALTER TABLE calls DROP CONSTRAINT IF EXISTS calls_school_id_fkey;
ALTER TABLE schools DROP CONSTRAINT IF EXISTS schools_owner_user_id_fkey;

-- ============================================
-- 3. Drop new tables
-- ============================================
DROP TABLE IF EXISTS phone_call_attempts;
DROP TABLE IF EXISTS school_invites;
DROP TABLE IF EXISTS schools;

-- ============================================
-- 4. Drop columns
-- ============================================
ALTER TABLE users DROP COLUMN IF EXISTS school_id;
ALTER TABLE users DROP COLUMN IF EXISTS phone_number;
ALTER TABLE calls DROP COLUMN IF EXISTS school_id;

-- ============================================
-- 5. Revert users.role CHECK constraint
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;

  -- Map new roles back to old roles
  UPDATE users SET role = 'admin'  WHERE role IN ('global_admin', 'school_admin');
  UPDATE users SET role = 'user'   WHERE role = 'staff';

  ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('user', 'admin'));

  ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';
END $$;

-- ============================================
-- 6. Re-enable original RLS policies on users (from migration.sql)
-- ============================================
CREATE POLICY users_select_own ON users
  FOR SELECT USING (
    email = current_setting('request.jwt.claims', true)::json->>'email'
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email'
      AND u.role = 'admin'
    )
  );

-- ============================================
-- 7. Re-enable original RLS policies on calls
-- ============================================
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

-- ============================================
-- 8. Re-enable original RLS policies on scorecards
-- ============================================
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

-- ============================================
-- 9. Re-enable original RLS policies on school_settings
-- ============================================
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

COMMIT;
