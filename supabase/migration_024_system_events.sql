CREATE TABLE IF NOT EXISTS system_events (
  id SERIAL PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'error'
    CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'resolved')),
  message TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
  call_id INTEGER REFERENCES calls(id) ON DELETE SET NULL,
  external_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_system_events_created
  ON system_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_events_status_created
  ON system_events(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_events_school_created
  ON system_events(school_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_events_call_id
  ON system_events(call_id);

CREATE INDEX IF NOT EXISTS idx_system_events_source_type
  ON system_events(source, event_type);

ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY system_events_select_global_admin ON system_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email'
      AND u.role IN ('global_admin', 'admin')
  )
);

CREATE POLICY system_events_insert_service_only ON system_events FOR INSERT WITH CHECK (false);
CREATE POLICY system_events_update_service_only ON system_events FOR UPDATE USING (false);
CREATE POLICY system_events_delete_service_only ON system_events FOR DELETE USING (false);
