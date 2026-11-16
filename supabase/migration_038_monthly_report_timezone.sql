-- Additive only: existing school fields, calls and scorecards are unchanged.
-- Monthly reports are calculated on demand; no report snapshots are stored.
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS reporting_timezone text NOT NULL DEFAULT 'UTC';
COMMENT ON COLUMN public.schools.reporting_timezone IS 'IANA timezone used for monthly DRP report boundaries; managed by school admins.';
