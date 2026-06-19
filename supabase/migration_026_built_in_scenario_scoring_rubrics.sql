-- Migration 026: Built-in scenario scoring rubric metadata
-- Safe follow-up for environments that already applied migration_025 before
-- scoring_rubric_type and scoring_categories were added to the table.

ALTER TABLE built_in_scenarios
  ADD COLUMN IF NOT EXISTS scoring_rubric_type VARCHAR(40),
  ADD COLUMN IF NOT EXISTS scoring_categories JSONB;
