-- Migration 031: Custom scenario objection controls
-- Custom scenarios can now use the same per-difficulty objection selection model as built-ins.

ALTER TABLE custom_scenarios
  ADD COLUMN IF NOT EXISTS objection_focus JSONB,
  ADD COLUMN IF NOT EXISTS objection_counts JSONB;
