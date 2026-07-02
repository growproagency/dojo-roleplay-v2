-- Migration 034: Enable custom scenarios by default for every school.
-- This is safe after migration 033 and keeps the admin toggle available for explicit disables.

ALTER TABLE schools
  ALTER COLUMN custom_scenarios_enabled SET DEFAULT true;

UPDATE schools
SET custom_scenarios_enabled = true
WHERE custom_scenarios_enabled IS DISTINCT FROM true;
