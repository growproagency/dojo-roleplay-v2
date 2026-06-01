-- Migration 010: Per-school usage cap (USD).
-- When a school's cumulative spend (Vapi cost + OpenAI scoring) reaches this
-- value, new web calls and inbound phone calls are rejected at the server.
-- NULL = no cap (unrestricted, current behavior for existing schools).

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS usage_cap_usd NUMERIC(10, 2);
