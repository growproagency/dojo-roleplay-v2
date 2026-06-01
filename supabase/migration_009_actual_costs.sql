-- Migration 009: Real per-call costs
-- - calls.cost_usd / cost_breakdown: rolled-up Vapi cost from end-of-call-report
-- - scorecards.prompt_tokens / completion_tokens / model / cost_usd: OpenAI scoring usage
-- All nullable; legacy rows fall back to the per-second estimate.

ALTER TABLE calls
  ADD COLUMN IF NOT EXISTS cost_usd NUMERIC(10, 6),
  ADD COLUMN IF NOT EXISTS cost_breakdown JSONB;

ALTER TABLE scorecards
  ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER,
  ADD COLUMN IF NOT EXISTS completion_tokens INTEGER,
  ADD COLUMN IF NOT EXISTS model VARCHAR(64),
  ADD COLUMN IF NOT EXISTS cost_usd NUMERIC(10, 6);

