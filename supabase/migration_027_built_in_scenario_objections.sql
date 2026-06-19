-- Migration 027: Built-in scenario objection metadata
-- Stores editable objection pools per difficulty. Runtime uses every objection
-- listed for the selected difficulty.

ALTER TABLE built_in_scenarios
  ADD COLUMN IF NOT EXISTS objection_focus JSONB;
