-- Migration 033: Per-school custom scenario entitlement and limit support.
-- Custom scenarios are disabled by default until onboarding/training is ready.

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS custom_scenarios_enabled BOOLEAN NOT NULL DEFAULT false;

UPDATE schools
SET custom_scenarios_enabled = false
WHERE custom_scenarios_enabled IS DISTINCT FROM false;
