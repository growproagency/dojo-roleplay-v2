-- Migration 030: Lock down direct client writes.
--
-- The frontend uses Supabase Auth directly, but application data writes should
-- go through the Express API. The backend uses the service_role key, which
-- bypasses RLS, so these revokes do not block server-side routes, Vapi
-- webhooks, scoring, admin actions, or invite flows.
--
-- This prevents authenticated browser clients from bypassing backend
-- validation/middleware by writing directly to Supabase tables with the anon
-- key and their user JWT.

REVOKE INSERT, UPDATE, DELETE ON TABLE
  public.users,
  public.schools,
  public.calls,
  public.scorecards,
  public.school_invites,
  public.custom_scenarios,
  public.built_in_scenarios,
  public.platform_settings,
  public.system_events,
  public.automation_events,
  public.phone_call_attempts
FROM anon, authenticated;

DO $$
BEGIN
  IF to_regclass('public.school_settings') IS NOT NULL THEN
    REVOKE INSERT, UPDATE, DELETE ON TABLE public.school_settings FROM anon, authenticated;
  END IF;
END $$;
