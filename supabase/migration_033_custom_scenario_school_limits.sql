-- Migration 033: Per-school custom scenario entitlement and limit support.
-- Schools can create custom scenarios by default; admins can disable access per school.

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS custom_scenarios_enabled BOOLEAN NOT NULL DEFAULT true;

UPDATE schools
SET custom_scenarios_enabled = true
WHERE custom_scenarios_enabled IS DISTINCT FROM true;
