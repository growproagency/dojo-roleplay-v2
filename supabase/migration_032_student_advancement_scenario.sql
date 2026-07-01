-- Migration 032: Add student advancement recommendation built-in scenario.
-- Runtime prompt, rubric, and objections live in backend/src/data/scenarios.js.

ALTER TABLE calls DROP CONSTRAINT IF EXISTS calls_scenario_check;

INSERT INTO built_in_scenarios
  (slug, title, description, first_message, voice_id, voice_provider, status)
VALUES
  (
    'student_advancement',
    'Student Advancement Recommendation',
    'Practice recommending an advancement or leadership opportunity based on student progress, attitude, and long-term development.',
    'Yeah, Maya has been really enjoying classes. The instructor said you wanted to talk with us about her progress?',
    'Paige',
    'vapi',
    'published'
  )
ON CONFLICT (slug) DO NOTHING;

UPDATE built_in_scenarios
SET
  system_prompt_base = $student_advancement_prompt$
## Your Role
You are a real person sitting in front of a staff member at a martial arts school.
CRITICAL: You are NEVER the business, NEVER the school, NEVER the staff.

## How to Talk
- Keep every response to 1-2 short sentences. Never more.
- Use contractions: "I'm", "I've", "don't", and "it's".
- Never volunteer information that was not asked for.
- Never break character.

## Who You Are
Your name is Dana. You are the parent of Maya, a student who has been training consistently and was recommended for an advancement and leadership opportunity.

## Your Opening Line
"Yeah, Maya has been really enjoying classes. The instructor said you wanted to talk with us about her progress?"

## Purpose of This Conversation
The staff member should identify whether Maya is ready for additional training opportunities based on her progress, attitude, and long-term development.

## Trigger
This conversation is happening because an instructor recommended Maya for advancement after seeing consistent skills, effort, and mindset.

## What Strong Staff Should Practice
- Student Progress Conversation: confirm that the student and parent are having a positive experience before introducing advancement.
- Present the Recommendation: acknowledge the student's accomplishments before introducing the opportunity.
- Explain the Next Level: explain faster pace, higher expectations, leadership, advanced techniques, and appropriate partner training in terms of student growth.
- Invite Them to Experience It: invite the family to a recommendation class instead of asking for an immediate commitment.
- Trial Class Experience: frame how the student will be welcomed, paired with a mentor, recognized, and allowed to experience the advanced environment.
- Post-Class Review: review what the student did well, readiness signals, continued development areas, and the next step.

## Situation
- Maya has grown in confidence and focus, and you have noticed she listens better at home.
- You are proud of her, but you do not want her pushed into something before she is ready.
- You want to understand why she was selected and what the next level actually changes.
- You are open to a recommendation class if it feels based on her development, not sales pressure.
- If they offer class times: Tuesday is possible, Thursday may work better if it is after school.

## Success Condition
If staff handles the conversation well, agree to attend a specific recommendation class or accept a clear development plan before the next recommendation.
If they pressure you, skip the progress conversation, or make it sound generic, stay hesitant.
$student_advancement_prompt$,
  scoring_rubric_type = 'studentAdvancement',
  scoring_categories = '[
    {"name":"Student Progress Conversation","weight":20,"anchors":{"10":"Excellent execution. The staff member confirms the family is having a positive experience, asks what changes they have noticed, and resolves concerns before moving on.","8-9":"Strong execution. Covers the progress conversation with only minor missed follow-up.","7-8":"Good but incomplete. Asks about experience or progress, but does not go deep enough.","5-6":"Partial execution. Mentions progress but mostly moves into the recommendation too quickly.","3-4":"Weak execution. Barely checks the family experience before pitching.","0-2":"Missing or harmful. Skips the progress conversation or ignores concerns."}},
    {"name":"Present the Recommendation","weight":15,"anchors":{"10":"Excellent execution. Acknowledges specific accomplishments and presents the recommendation as readiness-based and collaborative.","8-9":"Strong execution. Clearly frames the recommendation with only minor lack of specificity.","7-8":"Good but incomplete. Explains the recommendation but could connect it better to the student.","5-6":"Partial execution. Recommendation feels somewhat generic or rushed.","3-4":"Weak execution. Recommendation feels like a sales transition.","0-2":"Missing or harmful. No clear recommendation or it feels pressuring."}},
    {"name":"Explain the Next Level","weight":20,"anchors":{"10":"Excellent execution. Explains pace, expectations, leadership, advanced training, and growth outcomes clearly without feature dumping.","8-9":"Strong execution. Covers most differences with minor omissions.","7-8":"Good but incomplete. Explains the program but not enough student-growth connection.","5-6":"Partial execution. Gives a thin or feature-heavy explanation.","3-4":"Weak execution. The family would still not understand why the next level matters.","0-2":"Missing or harmful. Skips or misrepresents the next level."}},
    {"name":"Invite Them to Experience It","weight":15,"anchors":{"10":"Excellent execution. Invites the family to experience a recommendation class and offers two specific times without pressure.","8-9":"Strong execution. Clear invitation with only minor lack of specificity.","7-8":"Good but incomplete. Invites them but does not make the next step easy enough.","5-6":"Partial execution. Mentions a class but does not guide scheduling well.","3-4":"Weak execution. Asks for commitment too soon or vaguely says they can try it sometime.","0-2":"Missing or harmful. No experience-based next step."}},
    {"name":"Trial Class Experience","weight":15,"anchors":{"10":"Excellent execution. Clearly frames how the student will be welcomed, recognized, paired with support, and shown the advanced culture.","8-9":"Strong execution. Covers the trial experience with only minor missed details.","7-8":"Good but incomplete. Gives a basic class preview but lacks parent/student experience detail.","5-6":"Partial execution. Trial class explanation is thin or mostly logistical.","3-4":"Weak execution. The experience does not feel valuable or intentional.","0-2":"Missing or harmful. No meaningful trial class framing."}},
    {"name":"Post-Class Review","weight":15,"anchors":{"10":"Excellent execution. Explains the post-class review, readiness feedback, next enrollment step, or development plan clearly.","8-9":"Strong execution. Covers the review and next step with minor missed specificity.","7-8":"Good but incomplete. Mentions follow-up but lacks clear readiness criteria.","5-6":"Partial execution. Follow-up is vague or reactive.","3-4":"Weak execution. Little clarity on what happens after class.","0-2":"Missing or harmful. No post-class review or next-step plan."}}
  ]'::jsonb,
  objection_focus = '{
    "easy": [
      "Light readiness question: ask what made the instructors think Maya is ready.",
      "Light schedule question: ask when the recommendation class is offered.",
      "Light program question: ask what is different about the next level."
    ],
    "medium": [
      "Mild readiness concern: say you are proud of Maya but are not sure she is ready for a faster-paced class.",
      "Mild schedule concern: ask whether adding another class will be realistic with school and family commitments.",
      "Mild pressure concern: ask whether this is truly based on readiness or if everyone eventually gets offered it."
    ],
    "hard": [
      "Primary blocker: readiness. You worry Maya may not be mature or confident enough for the next level yet.",
      "Primary blocker: pressure concern. You are guarded because this could feel like a sales pitch instead of a true instructor recommendation.",
      "Primary blocker: schedule uncertainty. Additional classes may be difficult with school and family commitments.",
      "Primary blocker: value clarity. You need to understand how this supports Maya long term before attending a recommendation class."
    ]
  }'::jsonb,
  objection_counts = '{"easy":1,"medium":2,"hard":2}'::jsonb
WHERE slug = 'student_advancement';
