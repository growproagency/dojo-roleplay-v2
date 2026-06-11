-- Migration 023: Manual usage period controls for school monthly limits.
-- Calls and scorecards remain historical; these fields only control which
-- calls count toward the current monthly minute allowance.

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS usage_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS usage_period_end TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_schools_usage_period_start
  ON schools(usage_period_start);
