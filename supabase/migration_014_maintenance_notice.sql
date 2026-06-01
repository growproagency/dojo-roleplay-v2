-- Migration 014: Maintenance notice banner.
-- Adds three columns to platform_settings so the global admin can publish a
-- non-blocking banner that shows on every authenticated page. Severity drives
-- the banner color (info → blue, warning → amber, critical → red). Toggling
-- maintenance_enabled to FALSE hides the banner for all users on next refetch.

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS maintenance_enabled  BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS maintenance_message  TEXT,
  ADD COLUMN IF NOT EXISTS maintenance_severity VARCHAR(16) NOT NULL DEFAULT 'info'
    CHECK (maintenance_severity IN ('info', 'warning', 'critical'));
