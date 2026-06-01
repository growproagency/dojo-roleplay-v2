ALTER TABLE public.phone_call_attempts
  DROP CONSTRAINT IF EXISTS phone_call_attempts_outcome_check;

ALTER TABLE public.phone_call_attempts
  ADD CONSTRAINT phone_call_attempts_outcome_check
  CHECK (outcome IN ('accepted', 'rejected_unknown', 'rejected_rate_limit', 'rejected_usage_cap'));
