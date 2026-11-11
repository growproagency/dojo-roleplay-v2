-- Raw aggregates only. Difficulty rewards and qualification live in the service.
-- Service-role only: this RPC must never be callable by browser clients.
CREATE OR REPLACE FUNCTION public.leaderboard_aggregates(
  p_school_id integer DEFAULT NULL,
  p_scenario text DEFAULT NULL,
  p_difficulty text DEFAULT NULL,
  p_from timestamptz DEFAULT NULL,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  user_id integer, user_name text, user_email text, school_id integer,
  difficulty_stats jsonb, last_call_at timestamptz
)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  WITH grouped AS (
    SELECT c.user_id, c.difficulty, count(*) AS call_count,
      sum(s.overall_score::numeric) AS score_sum,
      max(s.overall_score) AS best_score, max(c.created_at) AS last_call_at
    FROM public.calls c
    JOIN public.scorecards s ON s.call_id = c.id
    WHERE c.status = 'scored' AND s.overall_score BETWEEN 0 AND 100
      AND (p_school_id IS NULL OR c.school_id = p_school_id)
      AND (p_scenario IS NULL OR c.scenario = p_scenario)
      AND (p_difficulty IS NULL OR c.difficulty = p_difficulty)
      AND (p_from IS NULL OR c.created_at >= p_from)
    GROUP BY c.user_id, c.difficulty
  )
  SELECT u.id, u.name::text, u.email::text, u.school_id,
    jsonb_agg(jsonb_build_object('difficulty', g.difficulty, 'call_count', g.call_count,
      'score_sum', g.score_sum, 'best_score', g.best_score)), max(g.last_call_at)
  FROM grouped g JOIN public.users u ON u.id = g.user_id
  GROUP BY u.id, u.name, u.email, u.school_id
  ORDER BY u.id
  LIMIT 100 OFFSET greatest(p_offset, 0);
$$;

REVOKE ALL ON FUNCTION public.leaderboard_aggregates(integer, text, text, timestamptz, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.leaderboard_aggregates(integer, text, text, timestamptz, integer) TO service_role;
