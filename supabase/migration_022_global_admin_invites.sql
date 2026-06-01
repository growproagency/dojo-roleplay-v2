-- Migration 022: Allow platform-level global admin invites.
ALTER TABLE school_invites
  ALTER COLUMN school_id DROP NOT NULL;

ALTER TABLE school_invites
  DROP CONSTRAINT IF EXISTS school_invites_role_check;

ALTER TABLE school_invites
  ADD CONSTRAINT school_invites_role_check
  CHECK (role IN ('staff', 'school_admin', 'global_admin'));

CREATE INDEX IF NOT EXISTS idx_school_invites_platform_open
  ON school_invites(email)
  WHERE school_id IS NULL AND accepted_at IS NULL AND revoked_at IS NULL;
