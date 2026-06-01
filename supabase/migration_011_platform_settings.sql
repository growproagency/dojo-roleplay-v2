-- Migration 011: Platform-level settings (single-row table).
-- Holds editable global config like the markup percentage applied on top of
-- raw vendor costs (Vapi + OpenAI) when computing what clients are billed.
-- Single-row enforced via a fixed primary key.

CREATE TABLE IF NOT EXISTS platform_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  markup_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the single row if missing
INSERT INTO platform_settings (id, markup_percent)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;
