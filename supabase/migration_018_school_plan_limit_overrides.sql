ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS member_limit INTEGER,
  ADD COLUMN IF NOT EXISTS monthly_roleplay_minutes INTEGER;
