-- Migration 029: Add kids outbound web lead callback built-in scenario.
-- Runtime prompt and rubric defaults live in backend/src/data/scenarios.js.

INSERT INTO built_in_scenarios
  (slug, title, description, first_message, voice_id, voice_provider, status)
VALUES
  (
    'kids_web_lead_callback',
    'Kids Outbound Web Lead Callback',
    'Practice calling back Melissa, a parent who submitted a web form about kids classes for her daughter. Build trust, uncover goals, and book a low-pressure trial.',
    NULL,
    'Paige',
    'vapi',
    'published'
  )
ON CONFLICT (slug) DO NOTHING;
