-- Migration 021: Subscription access status for schools.
ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'suspended', 'canceled')),
  ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS access_grace_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_schools_subscription_status
  ON schools(subscription_status);
