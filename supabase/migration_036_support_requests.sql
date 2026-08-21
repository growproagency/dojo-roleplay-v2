-- User-submitted support tickets. All access is through the service-role backend.
CREATE TABLE IF NOT EXISTS public.support_requests (
  id BIGSERIAL PRIMARY KEY,
  school_id INTEGER REFERENCES public.schools(id) ON DELETE SET NULL,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email VARCHAR(320) NOT NULL,
  category VARCHAR(32) NOT NULL CHECK (category IN ('practice_call', 'scoring', 'account', 'billing', 'feature', 'other')),
  subject VARCHAR(120) NOT NULL,
  message TEXT NOT NULL,
  page_url VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS support_requests_user_created_idx ON public.support_requests (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS support_requests_status_created_idx ON public.support_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS support_requests_school_created_idx ON public.support_requests (school_id, created_at DESC);

ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.support_requests TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.support_requests_id_seq TO service_role;
REVOKE ALL ON TABLE public.support_requests FROM anon, authenticated;
