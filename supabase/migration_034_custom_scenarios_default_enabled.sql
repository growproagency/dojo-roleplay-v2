-- Migration 034: Keep custom scenarios disabled by default.
-- This is safe after migration 033 and keeps the admin toggle available for explicit enables.

ALTER TABLE schools
  ALTER COLUMN custom_scenarios_enabled SET DEFAULT false;

UPDATE schools
SET custom_scenarios_enabled = false
WHERE custom_scenarios_enabled IS DISTINCT FROM false;
