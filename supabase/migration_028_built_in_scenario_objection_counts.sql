-- Migration 028: Per-difficulty objection counts for built-in scenarios

ALTER TABLE built_in_scenarios
  ADD COLUMN IF NOT EXISTS objection_counts JSONB;

