-- Migration 012: Two more platform-level defaults.
-- - default_llm_model: model used for post-call scoring. Falls back to LLM_MODEL
--   env var when null. Lets us A/B different models without a redeploy.
-- - default_usage_cap_usd: cap automatically applied to newly-created schools.
--   Null = new schools start unrestricted (existing behavior).

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS default_llm_model VARCHAR(64),
  ADD COLUMN IF NOT EXISTS default_usage_cap_usd NUMERIC(10, 2);
