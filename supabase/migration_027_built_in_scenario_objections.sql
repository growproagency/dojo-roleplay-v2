-- Migration 027: Built-in scenario objection metadata
-- Stores editable objection pools per difficulty. Runtime selects:
-- easy = 1 objection, medium = 2 objections, hard = 2 objections.

ALTER TABLE built_in_scenarios
  ADD COLUMN IF NOT EXISTS objection_focus JSONB;
