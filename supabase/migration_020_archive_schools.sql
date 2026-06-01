-- Migration 020: Archive schools instead of hard deleting them.
ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_schools_archived_at
  ON schools(archived_at);
