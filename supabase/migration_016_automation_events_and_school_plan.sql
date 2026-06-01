ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS plan VARCHAR(64);

ALTER TABLE public.school_invites
  ADD COLUMN IF NOT EXISTS full_name TEXT;

CREATE TABLE IF NOT EXISTS public.automation_events (
  id SERIAL PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  external_id VARCHAR(255),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(32) NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'processed', 'failed')),
  error_message TEXT,
  school_id INTEGER REFERENCES public.schools(id) ON DELETE SET NULL,
  invite_id INTEGER REFERENCES public.school_invites(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_events_source_created
  ON public.automation_events(source, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_events_external
  ON public.automation_events(source, external_id)
  WHERE external_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_automation_events_updated ON public.automation_events;
CREATE TRIGGER trg_automation_events_updated
  BEFORE UPDATE ON public.automation_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.automation_events ENABLE ROW LEVEL SECURITY;
