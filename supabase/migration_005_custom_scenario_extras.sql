-- Migration 005: Add display metadata and per-school scoping to custom scenarios
-- - character_blurb: short one-line descriptor shown on scenario cards
-- - topics: array of short pill labels shown on scenario cards
-- - school_id: NULL = platform-wide (visible to all schools), otherwise restricted to that school

ALTER TABLE custom_scenarios
  ADD COLUMN IF NOT EXISTS character_blurb TEXT,
  ADD COLUMN IF NOT EXISTS topics TEXT[],
  ADD COLUMN IF NOT EXISTS school_id INTEGER
    REFERENCES schools(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_custom_scenarios_school_id
  ON custom_scenarios(school_id);
