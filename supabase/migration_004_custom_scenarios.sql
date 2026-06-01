-- Migration 004: Custom scenarios (platform-wide)
-- Global admins can create custom training scenarios available to all schools.

CREATE TABLE IF NOT EXISTS custom_scenarios (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  context_type VARCHAR(50) NOT NULL DEFAULT 'inbound_call',
  character_name VARCHAR(100) NOT NULL,
  character_prompt TEXT NOT NULL,
  opening_line TEXT,
  voice_id VARCHAR(100) NOT NULL DEFAULT 'Elliot',
  voice_provider VARCHAR(50) NOT NULL DEFAULT 'vapi',
  scoring_prompt TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Store scenario title snapshot on calls so history is preserved if a custom scenario is renamed/deleted
ALTER TABLE calls ADD COLUMN IF NOT EXISTS scenario_title VARCHAR(255);

-- RLS
ALTER TABLE custom_scenarios ENABLE ROW LEVEL SECURITY;

-- Everyone can read active scenarios
CREATE POLICY custom_scenarios_select ON custom_scenarios
  FOR SELECT USING (true);

-- Only service role inserts/updates/deletes (all writes go through the backend)
CREATE POLICY custom_scenarios_insert ON custom_scenarios
  FOR INSERT WITH CHECK (false);

CREATE POLICY custom_scenarios_update ON custom_scenarios
  FOR UPDATE USING (false);

CREATE POLICY custom_scenarios_delete ON custom_scenarios
  FOR DELETE USING (false);
