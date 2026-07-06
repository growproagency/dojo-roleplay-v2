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
    {"name":"Student Progress Conversation","weight":20,"anchors":{"10":"Asks at least two progress questions, such as experience so far, changes noticed, biggest improvement, or how the child is enjoying training. If a concern appears, addresses it before continuing.","8-9":"Asks at least one real progress question and confirms the family is positive, but misses one useful follow-up or concern check.","7-8":"Asks a broad experience or progress question, but accepts a surface answer and moves on quickly.","5-6":"Mentions the student has progressed, but does not ask the parent or student for their view.","3-4":"Barely checks the family experience and bases the transition mostly on the instructor recommendation.","0-2":"Introduces advancement before checking experience, or ignores a concern the parent raises."}},
    {"name":"Present the Recommendation","weight":15,"anchors":{"10":"Names specific student accomplishments, frames the recommendation as readiness-based, says the coaching team believes the student is ready, and asks if the family has heard about the program before.","8-9":"Gives a specific readiness-based recommendation, but misses either the team framing or the collaborative question.","7-8":"Recommendation is clear, but the reason is generic, such as \"doing well\" without concrete examples.","5-6":"Says the student is eligible or invited, but gives little student-specific evidence.","3-4":"Moves into the program pitch before clearly recognizing the student accomplishments.","0-2":"Does not present a clear recommendation, or makes it sound automatic, sales-driven, or unrelated to readiness."}},
    {"name":"Explain the Next Level","weight":20,"anchors":{"10":"Explains that students are invited based on readiness and covers faster pace, higher expectations for effort/focus/leadership, advanced techniques or controlled partner training when appropriate, and long-term growth.","8-9":"Explains most key differences and connects them to student growth, with only one meaningful point missing.","7-8":"Explains some differences, but leans toward features instead of why the next level helps the student develop.","5-6":"Gives one or two vague benefits, such as \"more advanced\" or \"more leadership,\" without enough detail.","3-4":"Explanation is confusing, too short, or overpromises what the student will get.","0-2":"Skips the next-level explanation or describes it inaccurately."}},
    {"name":"Invite Them to Experience It","weight":15,"anchors":{"10":"Invites the family to a recommendation class instead of asking for an immediate commitment, explains that seeing the class is the best next step, and offers two specific class times.","8-9":"Invites them to experience a class and gives a specific next step, but offers only one time or leaves one logistics detail unclear.","7-8":"Invites them to observe or try the class, but does not offer specific times.","5-6":"Mentions they can come to a class sometime, but the next step is vague.","3-4":"Pushes for enrollment or a decision before offering the class experience.","0-2":"Does not offer an experience-based next step, or creates pressure instead of an invitation."}},
    {"name":"Trial Class Experience","weight":15,"anchors":{"10":"Explains what will happen in the recommendation class: the student is welcomed or recognized, paired with an experienced student or mentor, the parent can observe, expectations are demonstrated, and the student participates.","8-9":"Explains most of the class experience, with only one support or observation detail missing.","7-8":"Gives a basic class preview, but lacks detail about student support, parent observation, or how the next-level culture is shown.","5-6":"Mostly gives logistics such as day/time and says they can try it, without explaining the experience.","3-4":"Describes it like a normal class with no clear reason it helps the family evaluate the next level.","0-2":"Does not explain the trial or recommendation class experience."}},
    {"name":"Post-Class Review","weight":15,"anchors":{"10":"Explains that staff will reconnect after class to review what the student did well, readiness signs, skills still developing, and either next enrollment steps or a development plan.","8-9":"Includes a post-class review and next step, but misses either continued development areas or the alternate plan if the student is not ready.","7-8":"Says they will talk after class, but the review criteria or decision path is vague.","5-6":"Follow-up is mentioned only generally and does not explain how readiness will be reviewed.","3-4":"Little clarity on what happens after the class or who handles the next step.","0-2":"No post-class review plan, or implies the family must decide before seeing readiness feedback."}}
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
