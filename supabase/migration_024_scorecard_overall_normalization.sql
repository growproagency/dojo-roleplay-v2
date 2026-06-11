-- Migration 024: Normalize scorecard overall scores to a 0-100 scale.
-- Built-in scenarios are recomputed from category scores using the same rubric
-- weights now enforced in the backend. Custom/unknown scenarios are recomputed
-- from the average of their category scores.

UPDATE public.scorecards sc
SET overall_score = ROUND((
  (
    COALESCE((sc.categories->0->>'score')::numeric, 0) * 10 +
    COALESCE((sc.categories->1->>'score')::numeric, 0) * 20 +
    COALESCE((sc.categories->2->>'score')::numeric, 0) * 20 +
    COALESCE((sc.categories->3->>'score')::numeric, 0) * 20 +
    COALESCE((sc.categories->4->>'score')::numeric, 0) * 20 +
    COALESCE((sc.categories->5->>'score')::numeric, 0) * 10
  ) / 10
)::numeric, 1)
FROM public.calls c
WHERE c.id = sc.call_id
  AND c.scenario IN ('new_student', 'parent_enrollment')
  AND jsonb_array_length(sc.categories) >= 6;

UPDATE public.scorecards sc
SET overall_score = ROUND((
  (
    COALESCE((sc.categories->0->>'score')::numeric, 0) * 20 +
    COALESCE((sc.categories->1->>'score')::numeric, 0) * 20 +
    COALESCE((sc.categories->2->>'score')::numeric, 0) * 15 +
    COALESCE((sc.categories->3->>'score')::numeric, 0) * 20 +
    COALESCE((sc.categories->4->>'score')::numeric, 0) * 15 +
    COALESCE((sc.categories->5->>'score')::numeric, 0) * 10
  ) / 10
)::numeric, 1)
FROM public.calls c
WHERE c.id = sc.call_id
  AND c.scenario = 'web_lead_callback'
  AND jsonb_array_length(sc.categories) >= 6;

UPDATE public.scorecards sc
SET overall_score = ROUND((
  (
    COALESCE((sc.categories->0->>'score')::numeric, 0) * 25 +
    COALESCE((sc.categories->1->>'score')::numeric, 0) * 20 +
    COALESCE((sc.categories->2->>'score')::numeric, 0) * 15 +
    COALESCE((sc.categories->3->>'score')::numeric, 0) * 15 +
    COALESCE((sc.categories->4->>'score')::numeric, 0) * 15 +
    COALESCE((sc.categories->5->>'score')::numeric, 0) * 10
  ) / 10
)::numeric, 1)
FROM public.calls c
WHERE c.id = sc.call_id
  AND c.scenario = 'sales_enrollment'
  AND jsonb_array_length(sc.categories) >= 6;

UPDATE public.scorecards sc
SET overall_score = ROUND((
  (
    COALESCE((sc.categories->0->>'score')::numeric, 0) * 15 +
    COALESCE((sc.categories->1->>'score')::numeric, 0) * 30 +
    COALESCE((sc.categories->2->>'score')::numeric, 0) * 20 +
    COALESCE((sc.categories->3->>'score')::numeric, 0) * 20 +
    COALESCE((sc.categories->4->>'score')::numeric, 0) * 10 +
    COALESCE((sc.categories->5->>'score')::numeric, 0) * 5
  ) / 10
)::numeric, 1)
FROM public.calls c
WHERE c.id = sc.call_id
  AND c.scenario = 'renewal_conference'
  AND jsonb_array_length(sc.categories) >= 6;

UPDATE public.scorecards sc
SET overall_score = ROUND((
  (
    COALESCE((sc.categories->0->>'score')::numeric, 0) * 20 +
    COALESCE((sc.categories->1->>'score')::numeric, 0) * 25 +
    COALESCE((sc.categories->2->>'score')::numeric, 0) * 25 +
    COALESCE((sc.categories->3->>'score')::numeric, 0) * 15 +
    COALESCE((sc.categories->4->>'score')::numeric, 0) * 15
  ) / 10
)::numeric, 1)
FROM public.calls c
WHERE c.id = sc.call_id
  AND c.scenario = 'cancellation_save'
  AND jsonb_array_length(sc.categories) >= 5;

UPDATE public.scorecards sc
SET overall_score = custom_scores.overall_score
FROM public.calls c
JOIN LATERAL (
  SELECT ROUND((AVG((category->>'score')::numeric) * 10)::numeric, 1) AS overall_score
  FROM jsonb_array_elements(sc.categories) AS category
) custom_scores ON true
WHERE c.id = sc.call_id
  AND c.scenario NOT IN (
    'new_student',
    'parent_enrollment',
    'web_lead_callback',
    'sales_enrollment',
    'renewal_conference',
    'cancellation_save'
  )
  AND jsonb_typeof(sc.categories) = 'array'
  AND jsonb_array_length(sc.categories) > 0
  AND custom_scores.overall_score IS NOT NULL;
