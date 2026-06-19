-- Migration 025: Editable built-in scenarios
-- Built-ins stay separate from tenant custom scenarios. Draft rows are admin-only
-- and do not affect live practice calls until published.

CREATE TABLE IF NOT EXISTS built_in_scenarios (
  slug               VARCHAR(100) PRIMARY KEY,
  title              VARCHAR(255) NOT NULL,
  description        TEXT NOT NULL,
  system_prompt_base TEXT,
  first_message      TEXT,
  voice_id           VARCHAR(100) NOT NULL DEFAULT 'Elliot',
  voice_provider     VARCHAR(50) NOT NULL DEFAULT 'vapi',
  scoring_rubric_type VARCHAR(40),
  scoring_categories JSONB,
  status             VARCHAR(20) NOT NULL DEFAULT 'published'
                       CHECK (status IN ('draft', 'published')),
  updated_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_built_in_scenarios_updated
  BEFORE UPDATE ON built_in_scenarios FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE built_in_scenarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS built_in_scenarios_select ON built_in_scenarios;
DROP POLICY IF EXISTS built_in_scenarios_insert ON built_in_scenarios;
DROP POLICY IF EXISTS built_in_scenarios_update ON built_in_scenarios;
DROP POLICY IF EXISTS built_in_scenarios_delete ON built_in_scenarios;

CREATE POLICY built_in_scenarios_select ON built_in_scenarios FOR SELECT USING (true);
CREATE POLICY built_in_scenarios_insert ON built_in_scenarios FOR INSERT WITH CHECK (false);
CREATE POLICY built_in_scenarios_update ON built_in_scenarios FOR UPDATE USING (false);
CREATE POLICY built_in_scenarios_delete ON built_in_scenarios FOR DELETE USING (false);

INSERT INTO built_in_scenarios
  (slug, title, description, first_message, voice_id, voice_provider, status)
VALUES
  (
    'new_student',
    'New Adult Student Inquiry',
    'Practice with Jordan, an adult who found you online and wants to get in shape. Handle cost, schedule, and commitment objections.',
    'Hey, I was just calling to get some info about your adult classes?',
    'Elliot',
    'vapi',
    'published'
  ),
  (
    'parent_enrollment',
    'Parent Enrolling a Child',
    'Practice with Sarah, a parent calling about enrolling her 7-year-old son. Address safety, discipline benefits, and schedule questions.',
    'Hi, yeah - I''m calling about your kids'' program? I''m thinking about enrolling my son.',
    'Emma',
    'vapi',
    'published'
  ),
  (
    'web_lead_callback',
    'Outbound Web Lead Callback',
    'Practice calling back Alex, a prospect who submitted a web form. Build rapport quickly, overcome skepticism, and book the appointment.',
    NULL,
    'Rohan',
    'vapi',
    'published'
  ),
  (
    'sales_enrollment',
    'Sales Enrollment Conference',
    'Practice enrolling Jamie after a trial class. Follow the 4-step process: uncover goals, teach the benefit, pre-frame the upgrade, and present pricing.',
    'Yeah, the class was really good! I liked it.',
    'Nico',
    'vapi',
    'published'
  ),
  (
    'renewal_conference',
    'Renewal Conference',
    'Practice renewing Pat, a parent whose child has been training for 10 months. Ask the 3 Progress Check questions and present the renewal confidently.',
    'Yeah, Tyler''s been really enjoying it. I''m glad we tried it.',
    'Savannah',
    'vapi',
    'published'
  ),
  (
    'cancellation_save',
    'Cancellation Save',
    'Practice saving Morgan, a parent calling to cancel. Use the Universal Opening, identify the real reason, deploy the Extended Time Guarantee, and close.',
    'Hi, I''m calling because I need to cancel Cameron''s membership.',
    'Clara',
    'vapi',
    'published'
  )
ON CONFLICT (slug) DO NOTHING;
