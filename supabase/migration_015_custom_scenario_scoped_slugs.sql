-- Allow the same custom scenario slug to exist in different schools while
-- preserving uniqueness for platform-wide scenarios.

ALTER TABLE public.custom_scenarios
  DROP CONSTRAINT IF EXISTS custom_scenarios_slug_key;

DROP INDEX IF EXISTS public.custom_scenarios_global_slug_unique;
DROP INDEX IF EXISTS public.custom_scenarios_school_slug_unique;

CREATE UNIQUE INDEX custom_scenarios_global_slug_unique
  ON public.custom_scenarios (slug)
  WHERE school_id IS NULL;

CREATE UNIQUE INDEX custom_scenarios_school_slug_unique
  ON public.custom_scenarios (school_id, slug)
  WHERE school_id IS NOT NULL;