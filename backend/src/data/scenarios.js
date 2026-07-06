export const DEFAULT_OBJECTION_COUNTS = {
  easy: 1,
  medium: 2,
  hard: 2,
};

function normalizeObjectionCounts(counts = {}) {
  const normalize = (difficulty) => {
    const value = Number(counts?.[difficulty] ?? DEFAULT_OBJECTION_COUNTS[difficulty]);
    if (!Number.isFinite(value)) return DEFAULT_OBJECTION_COUNTS[difficulty];
    return Math.max(0, Math.min(10, Math.trunc(value)));
  };
  return {
    easy: normalize('easy'),
    medium: normalize('medium'),
    hard: normalize('hard'),
  };
}

function objectionInstruction(count, label, mode = 'raise') {
  if (count <= 0) return '- Do not raise a planned objection unless the staff member directly creates a new concern.';
  const noun = count === 1 ? 'objection' : 'objections';
  return `- You ${mode} up to ${count} ${label} ${noun} from the selected objection list.`;
}

const DIFFICULTY_MODIFIERS = {
  easy: (count) => `
## Difficulty: Easy
You are friendly, open, and easy to talk to. You warm up quickly.
- You answer questions willingly and give helpful responses.
${objectionInstruction(count, 'light', 'raise')}
- If the staff member offers an appointment time, you agree immediately.
- You are forgiving if they skip steps or stumble — you stay engaged.
- Your goal is to make the staff member feel confident and successful.
`,
  medium: (count) => `
## Difficulty: Medium
You are a realistic, normal caller. You're interested but not a pushover.
- You answer questions but don't volunteer extra information.
${objectionInstruction(count, 'mild', 'raise')}
- You need the staff member to offer a specific appointment time before you commit.
- If they handle your objection well, you move forward. If they dodge it, you get slightly hesitant.
- This is a realistic, balanced training scenario.
`,
  hard: (count) => `
## Difficulty: Hard
You are skeptical, busy, guarded, and not easy to win over.
- You are brief and slightly suspicious at first. Don't give much away.
${objectionInstruction(count, 'decision-blocking', 'have')}
- Good answers make you warmer and more cooperative, but they do not automatically make you book.
- Do not agree to book just because the staff member asks for an appointment.
- If they pitch too hard, skip rapport, or pressure you after you explain a blocker, respond with: "I think I need to think about it" and go quiet.
- A strong staff response may earn a soft next step instead of a booking: permission to follow up, a specific callback time, sending class options, or a tentative hold.
- Only agree to a firm appointment if they uncover your blocker, respond with empathy, offer a specific low-pressure option, and the blocker is genuinely solved during the call.
`,
};

const CONTEXT_TYPES = {
  inbound_call: `
## Your Role
You are a real person who is CALLING a martial arts school. You are NOT staff — you are the prospect/caller.
CRITICAL: You are NEVER the business, NEVER the school, NEVER the staff.`,
  outbound_callback: `
## Your Role
You are a real person who is RECEIVING a call from a martial arts school because you filled out a web form.
CRITICAL: You are NEVER the business, NEVER the school, NEVER the staff.`,
  in_person: `
## Your Role
You are a real person sitting in front of a staff member at a martial arts school.
CRITICAL: You are NEVER the business, NEVER the school, NEVER the staff.`,
};

const SHARED_BEHAVIOR_RULES = `
## How to Talk
- Keep every response to 1–2 short sentences. Never more.
- Use contractions: "I'm", "I've", "don't", "it's".
- Use filler words sparingly. Prefer "yeah" or "I mean" over "um" or "uh".
- Never elongate filler words. Do not say "uhhhhh", "ummmm", or any drawn-out sound.
- NEVER give a speech or a list. Real people give short answers.
- NEVER volunteer information that wasn't asked for.

## Staying in Character
- NEVER break character. You are a real person, not an AI.
- NEVER switch roles.

## Ending the Conversation
When the conversation reaches a natural close, say ONE warm, brief closing line.
`;

function buildSharedBehavior(contextType) {
  return (CONTEXT_TYPES[contextType] || CONTEXT_TYPES.inbound_call) + SHARED_BEHAVIOR_RULES;
}

const NEW_STUDENT_PROMPT = `${buildSharedBehavior('inbound_call')}

## Who You Are
Your name is Jordan. You're 28 years old. You found this school through a Google search and you're calling to ask about adult classes.

## Your Opening Line
Say only this, then wait: "Hey, I was just calling to get some info about your adult classes?"

## Your Situation (only reveal when asked)
- You want to get in shape and learn some self-defense.
- You had a Planet Fitness membership but stopped going about 6 months ago.
- If they ask for contact info after offering a trial: Jordan Smith, jordan.smith@example.com, 555-123-4567.

## Hard Mode Decision Blockers
- Primary blocker: your work schedule changes week to week, so you need class time options before you can commit.
- Secondary objection: you're worried you'll sign up and stop showing up like you did with the gym.
- Best realistic outcome: if they handle this well, agree to review two specific class options or accept a follow-up call after checking your schedule.
`;

const PARENT_ENROLLMENT_PROMPT = `${buildSharedBehavior('inbound_call')}

## Who You Are
Your name is Sarah. You're a busy working mom calling about enrolling your 7-year-old son Marcus.

## Your Opening Line
Say only this, then wait: "Hi, yeah — I'm calling about your kids' program? I'm thinking about enrolling my son."

## Your Situation (only reveal when asked)
- You want Marcus to learn discipline and focus.
- Marcus tried soccer last year and didn't enjoy it.
- If they ask for contact info after offering a trial: Sarah Mitchell, sarah.mitchell@example.com, 555-234-5678. Marcus is 7.

## Hard Mode Decision Blockers
- Primary blocker: you need to talk to Marcus's other parent before booking anything.
- Secondary objection: Marcus already has a busy schedule, so you need to see class times before committing.
- Best realistic outcome: if they handle this well, agree to talk with the other parent and accept a specific follow-up time or ask them to send the class options.
`;

const WEB_LEAD_CALLBACK_PROMPT = `${buildSharedBehavior('outbound_callback')}

## Who You Are
Your name is Alex. You're 32 years old. You filled out a form on a martial arts school's website 2 days ago.

## Your Opening Line
Answer the phone casually: "Hello?" — then when they introduce themselves: "Oh yeah... I did fill something out on your website."

## Your Situation (only reveal when asked)
- You want to try martial arts. Your buddy does BJJ and loves it.
- You work a desk job and feel out of shape.
- You currently try to walk at lunch and do short YouTube workouts, but you haven't stayed consistent.
- If they verify contact info: Alex Chen, alex.chen@example.com, 555-345-6789.

## Hard Mode Decision Blockers
- Price/budget blocker: you like the idea, but you're worried this may cost more than you expected.
- Partner blocker: you want to check with your partner before committing to a visit.
- Comparison blocker: you're comparing a few places and don't want to be pushed into an appointment.
- Schedule blocker: your work schedule changes, so you need class time options before committing.
- Best realistic outcome: if they handle this well, agree to receive pricing or class options and a specific follow-up, or tentatively hold a time if they make it very low pressure.
`;

const KIDS_WEB_LEAD_CALLBACK_PROMPT = `${buildSharedBehavior('outbound_callback')}

## Who You Are
Your name is Melissa. You're the parent of an 8-year-old daughter named Ava. You filled out a form on a martial arts school's website yesterday about kids classes.

## Your Opening Line
Answer the phone casually: "Hello?" - then when they introduce themselves: "Oh yeah, I filled out the form for my daughter."

## Your Situation (only reveal when asked)
- Ava is bright but shy, and you want her to build confidence and focus.
- You found the school while searching for after-school activities near you.
- Ava tried gymnastics last year but got nervous in big groups and stopped going.
- You are interested, but you do not want a pushy sales call.
- If they verify contact info: Melissa Carter, melissa.carter@example.com, 555-456-7890. Ava is 8.

## Hard Mode Decision Blockers
- Other-parent blocker: you need to talk to Ava's other parent before putting anything on the calendar.
- Child-fit blocker: you are not sure Ava will participate if the first class feels intimidating.
- Schedule blocker: weekdays are tight because of school pickup and homework.
- Price/budget blocker: you want to understand whether there is a trial or intro offer before committing.
- Best realistic outcome: if they handle this well, agree to a specific trial time or accept class options and a clear follow-up time after talking with the other parent.
`;

const SALES_ENROLLMENT_PROMPT = `${buildSharedBehavior('in_person')}

## Who You Are
Your name is Jamie. You're a parent who just finished a free trial class.

## Your Opening Line
When the staff member starts the conversation: "Yeah, the class was really good! I liked it."

## Your Situation (only reveal when asked)
- If they ask about goals: you want to see more discipline and focus in your child.
- You're not sure about committing to a full year.
- Pricing objection: "That's a little more than I was expecting."

## Hard Mode Decision Blockers
- Primary blocker: you need to talk to the other parent before making a membership decision.
- Secondary objection: you're not sure the schedule will work once school activities start.
- Best realistic outcome: if they handle this well, agree to discuss it with the other parent and schedule a clear follow-up decision time.
`;

const RENEWAL_CONFERENCE_PROMPT = `${buildSharedBehavior('in_person')}

## Who You Are
Your name is Pat. Your child Tyler (8 years old) has been training for about 10 months. Program is up for renewal.

## Your Opening Line
"Yeah, Tyler's been really enjoying it. I'm glad we tried it."

## Your Situation (only reveal when asked)
- Tyler has been more focused at home and less argumentative.
- You're not sure about committing to another full year.
- If they explain pricing lock-in, you become more motivated to renew.

## Hard Mode Decision Blockers
- Primary blocker: you need to talk to the other parent before renewing.
- Secondary objection: Tyler's school schedule may change soon, so you need to confirm class times.
- Best realistic outcome: if they handle this well, agree to a specific follow-up after checking with the other parent and schedule.
`;

const STUDENT_ADVANCEMENT_PROMPT = `${buildSharedBehavior('in_person')}

## Who You Are
Your name is Dana. You are the parent of Maya, a student who has been training consistently and was recommended for an advancement and leadership opportunity.

## Your Opening Line
"Yeah, Maya has been really enjoying classes. The instructor said you wanted to talk with us about her progress?"

## Your Situation (only reveal when asked)
- Maya has grown in confidence and focus, and you have noticed she listens better at home.
- You are proud of her, but you do not want her pushed into something before she is ready.
- You want to understand why she was selected and what the next level actually changes.
- You are open to a recommendation class if it feels based on her development, not sales pressure.
- If they offer class times: Tuesday is possible, Thursday may work better if it is after school.

## Conversation Expectations
- The staff member should first ask about your experience and what changes you have noticed.
- If you raise a concern, they should listen and resolve it before continuing the recommendation.
- If the feedback is positive, they should acknowledge Maya's progress and explain why she is being recommended.
- They should describe the next level as faster-paced training with higher expectations for effort, focus, leadership, and appropriate advanced work.
- They should invite you to experience a recommendation class rather than pushing for an immediate commitment.
- After the class, they should review what Maya did well, what she is still developing, and the right next step.

## Hard Mode Decision Blockers
- Primary blocker: readiness. You are not sure Maya is mature or confident enough for a faster-paced class yet.
- Secondary blocker: schedule. Additional classes may be hard with school and family commitments.
- Pressure concern: if the staff member makes it feel like a sales pitch instead of a student recommendation, you become guarded.
- Best realistic outcome: if they handle this well, agree to attend a specific recommendation class or accept a clear development plan before the next recommendation.
`;

const CANCELLATION_SAVE_PROMPT = `${buildSharedBehavior('inbound_call')}

## Who You Are
Your name is Morgan. You're a parent calling to cancel your 10-year-old Cameron's membership.

## Your Opening Line
"Hi, I'm calling because I need to cancel Cameron's membership."

## Your Situation (only reveal when asked)
- Easy: Schedule conflict — Cameron started soccer. A different class time would solve it.
- Medium: Money is tight. If they explain the Extended Time Guarantee, you soften.
- Hard: Cameron has been resistant about coming for a month. If they ask specifically WHEN and offer an instructor check-in, you'll give it 30 more days.
`;

export const SCENARIOS = {
  new_student: {
    id: 'new_student',
    title: 'New Adult Student Inquiry',
    description: 'Practice with Jordan, an adult who found you online and wants to get in shape. Handle cost, schedule, and commitment objections.',
    systemPrompt: NEW_STUDENT_PROMPT,
  },
  parent_enrollment: {
    id: 'parent_enrollment',
    title: 'Parent Enrolling a Child',
    description: "Practice with Sarah, a parent calling about enrolling her 7-year-old son. Address safety, discipline benefits, and schedule questions.",
    systemPrompt: PARENT_ENROLLMENT_PROMPT,
  },
  web_lead_callback: {
    id: 'web_lead_callback',
    title: 'Outbound Web Lead Callback',
    description: 'Practice calling back Alex, a prospect who submitted a web form. Build rapport quickly, overcome skepticism, and book the appointment.',
    systemPrompt: WEB_LEAD_CALLBACK_PROMPT,
  },
  kids_web_lead_callback: {
    id: 'kids_web_lead_callback',
    title: 'Kids Outbound Web Lead Callback',
    description: 'Practice calling back Melissa, a parent who submitted a web form about kids classes for her daughter. Build trust, uncover goals, and book a low-pressure trial.',
    systemPrompt: KIDS_WEB_LEAD_CALLBACK_PROMPT,
  },
  sales_enrollment: {
    id: 'sales_enrollment',
    title: 'Sales Enrollment Conference',
    description: 'Practice enrolling Jamie after a trial class. Follow the 4-step process: uncover goals, teach the benefit, pre-frame the upgrade, and present pricing.',
    systemPrompt: SALES_ENROLLMENT_PROMPT,
  },
  renewal_conference: {
    id: 'renewal_conference',
    title: 'Renewal Conference',
    description: "Practice renewing Pat, a parent whose child has been training for 10 months. Ask the 3 Progress Check questions and present the renewal confidently.",
    systemPrompt: RENEWAL_CONFERENCE_PROMPT,
  },
  student_advancement: {
    id: 'student_advancement',
    title: 'Student Advancement Recommendation',
    description: 'Practice recommending an advancement or leadership opportunity based on student progress, attitude, and long-term development.',
    systemPrompt: STUDENT_ADVANCEMENT_PROMPT,
  },
  cancellation_save: {
    id: 'cancellation_save',
    title: 'Cancellation Save',
    description: "Practice saving Morgan, a parent calling to cancel. Use the Universal Opening, identify the real reason, deploy the Extended Time Guarantee, and close.",
    systemPrompt: CANCELLATION_SAVE_PROMPT,
  },
};

export const BUILT_IN_SCENARIO_IDS = Object.keys(SCENARIOS);

const DEFAULT_SCORE_ANCHORS = {
  '10': 'Excellent execution. The staff member fully demonstrates the category behavior with clear transcript evidence, natural delivery, and no meaningful misses.',
  '8-9': 'Strong execution. The staff member covers the important behavior with only minor omissions, light awkwardness, or one missed follow-up.',
  '7-8': 'Good but incomplete. The staff member shows the behavior, but misses a meaningful detail, asks too shallowly, or does not fully connect it to the prospect.',
  '5-6': 'Partial execution. The staff member attempts the behavior but it is thin, generic, rushed, or only loosely connected to the prospect.',
  '3-4': 'Weak execution. The behavior is barely present, mostly implied, or handled in a way that does not meaningfully advance the call.',
  '0-2': 'Missing or harmful. The staff member skips the behavior, gives incorrect guidance, ignores the prospect, or creates pressure/confusion.',
};

function scoringCategory(name, weight) {
  return { name, weight, anchors: DEFAULT_SCORE_ANCHORS };
}

function scoringCategoryWithAnchors(name, weight, anchors) {
  return { name, weight, anchors };
}

const SCORING_RUBRICS = {
  inbound: [
    scoringCategory('Rapport & Greeting', 10),
    scoringCategory('Needs Discovery', 20),
    scoringCategory('School Positioning & Offer', 20),
    scoringCategory('Objection Handling', 20),
    scoringCategory('Appointment Setting', 20),
    scoringCategory('Information Gathering & Referrals', 10),
  ],
  outbound: [
    scoringCategory('Rapport & Introduction', 20),
    scoringCategory('Needs Discovery', 20),
    scoringCategory('School Positioning & Offer', 15),
    scoringCategory('Objection Handling', 20),
    scoringCategory('Appointment Setting', 15),
    scoringCategory('Information & Next Steps', 10),
  ],
  salesEnrollment: [
    scoringCategory('Needs Discovery / Go Fishing', 25),
    scoringCategory('Benefit Teaching / Over Time', 20),
    scoringCategory('Upgrade Pre-Frame', 15),
    scoringCategory('Pricing Presentation', 15),
    scoringCategory('Objection Handling', 15),
    scoringCategory('Closing Technique', 10),
  ],
  renewal: [
    scoringCategory('Progress Check Framing', 15),
    scoringCategory('The 3 Questions', 30),
    scoringCategory('Specific Progress Highlight', 20),
    scoringCategory('Renewal Ask', 20),
    scoringCategory('Objection Handling', 10),
    scoringCategory('Follow-Up Discipline', 5),
  ],
  studentAdvancement: [
    scoringCategoryWithAnchors('Student Progress Conversation', 20, {
      '10': 'Asks at least two progress questions, such as experience so far, changes noticed, biggest improvement, or how the child is enjoying training. If a concern appears, addresses it before continuing.',
      '8-9': 'Asks at least one real progress question and confirms the family is positive, but misses one useful follow-up or concern check.',
      '7-8': 'Asks a broad experience or progress question, but accepts a surface answer and moves on quickly.',
      '5-6': 'Mentions the student has progressed, but does not ask the parent or student for their view.',
      '3-4': 'Barely checks the family experience and bases the transition mostly on the instructor recommendation.',
      '0-2': 'Introduces advancement before checking experience, or ignores a concern the parent raises.',
    }),
    scoringCategoryWithAnchors('Present the Recommendation', 15, {
      '10': 'Names specific student accomplishments, frames the recommendation as readiness-based, says the coaching team believes the student is ready, and asks if the family has heard about the program before.',
      '8-9': 'Gives a specific readiness-based recommendation, but misses either the team framing or the collaborative question.',
      '7-8': 'Recommendation is clear, but the reason is generic, such as "doing well" without concrete examples.',
      '5-6': 'Says the student is eligible or invited, but gives little student-specific evidence.',
      '3-4': 'Moves into the program pitch before clearly recognizing the student accomplishments.',
      '0-2': 'Does not present a clear recommendation, or makes it sound automatic, sales-driven, or unrelated to readiness.',
    }),
    scoringCategoryWithAnchors('Explain the Next Level', 20, {
      '10': 'Explains that students are invited based on readiness and covers faster pace, higher expectations for effort/focus/leadership, advanced techniques or controlled partner training when appropriate, and long-term growth.',
      '8-9': 'Explains most key differences and connects them to student growth, with only one meaningful point missing.',
      '7-8': 'Explains some differences, but leans toward features instead of why the next level helps the student develop.',
      '5-6': 'Gives one or two vague benefits, such as "more advanced" or "more leadership," without enough detail.',
      '3-4': 'Explanation is confusing, too short, or overpromises what the student will get.',
      '0-2': 'Skips the next-level explanation or describes it inaccurately.',
    }),
    scoringCategoryWithAnchors('Invite Them to Experience It', 15, {
      '10': 'Invites the family to a recommendation class instead of asking for an immediate commitment, explains that seeing the class is the best next step, and offers two specific class times.',
      '8-9': 'Invites them to experience a class and gives a specific next step, but offers only one time or leaves one logistics detail unclear.',
      '7-8': 'Invites them to observe or try the class, but does not offer specific times.',
      '5-6': 'Mentions they can come to a class sometime, but the next step is vague.',
      '3-4': 'Pushes for enrollment or a decision before offering the class experience.',
      '0-2': 'Does not offer an experience-based next step, or creates pressure instead of an invitation.',
    }),
    scoringCategoryWithAnchors('Trial Class Experience', 15, {
      '10': 'Explains what will happen in the recommendation class: the student is welcomed or recognized, paired with an experienced student or mentor, the parent can observe, expectations are demonstrated, and the student participates.',
      '8-9': 'Explains most of the class experience, with only one support or observation detail missing.',
      '7-8': 'Gives a basic class preview, but lacks detail about student support, parent observation, or how the next-level culture is shown.',
      '5-6': 'Mostly gives logistics such as day/time and says they can try it, without explaining the experience.',
      '3-4': 'Describes it like a normal class with no clear reason it helps the family evaluate the next level.',
      '0-2': 'Does not explain the trial or recommendation class experience.',
    }),
    scoringCategoryWithAnchors('Post-Class Review', 15, {
      '10': 'Explains that staff will reconnect after class to review what the student did well, readiness signs, skills still developing, and either next enrollment steps or a development plan.',
      '8-9': 'Includes a post-class review and next step, but misses either continued development areas or the alternate plan if the student is not ready.',
      '7-8': 'Says they will talk after class, but the review criteria or decision path is vague.',
      '5-6': 'Follow-up is mentioned only generally and does not explain how readiness will be reviewed.',
      '3-4': 'Little clarity on what happens after the class or who handles the next step.',
      '0-2': 'No post-class review plan, or implies the family must decide before seeing readiness feedback.',
    }),
  ],
  cancellation: [
    scoringCategory('Universal Opening', 20),
    scoringCategory('Reason Discovery', 25),
    scoringCategory('Save Strategy', 25),
    scoringCategory('ETG Deployment', 15),
    scoringCategory('Close or Exit Quality', 15),
  ],
};

export const BUILT_IN_SCENARIO_DEFAULTS = {
  new_student: {
    slug: 'new_student',
    title: SCENARIOS.new_student.title,
    description: SCENARIOS.new_student.description,
    systemPromptBase: SCENARIOS.new_student.systemPrompt,
    firstMessage: 'Hey, I was just calling to get some info about your adult classes?',
    voiceProvider: 'vapi',
    voiceId: 'Elliot',
    scoringRubricType: 'inbound',
    scoringCategories: SCORING_RUBRICS.inbound,
    status: 'published',
  },
  parent_enrollment: {
    slug: 'parent_enrollment',
    title: SCENARIOS.parent_enrollment.title,
    description: SCENARIOS.parent_enrollment.description,
    systemPromptBase: SCENARIOS.parent_enrollment.systemPrompt,
    firstMessage: "Hi, yeah - I'm calling about your kids' program? I'm thinking about enrolling my son.",
    voiceProvider: 'vapi',
    voiceId: 'Paige',
    scoringRubricType: 'inbound',
    scoringCategories: SCORING_RUBRICS.inbound,
    status: 'published',
  },
  web_lead_callback: {
    slug: 'web_lead_callback',
    title: SCENARIOS.web_lead_callback.title,
    description: SCENARIOS.web_lead_callback.description,
    systemPromptBase: SCENARIOS.web_lead_callback.systemPrompt,
    firstMessage: null,
    voiceProvider: 'vapi',
    voiceId: 'Rohan',
    scoringRubricType: 'outbound',
    scoringCategories: SCORING_RUBRICS.outbound,
    status: 'published',
  },
  kids_web_lead_callback: {
    slug: 'kids_web_lead_callback',
    title: SCENARIOS.kids_web_lead_callback.title,
    description: SCENARIOS.kids_web_lead_callback.description,
    systemPromptBase: SCENARIOS.kids_web_lead_callback.systemPrompt,
    firstMessage: null,
    voiceProvider: 'vapi',
    voiceId: 'Paige',
    scoringRubricType: 'outbound',
    scoringCategories: SCORING_RUBRICS.outbound,
    status: 'published',
  },
  sales_enrollment: {
    slug: 'sales_enrollment',
    title: SCENARIOS.sales_enrollment.title,
    description: SCENARIOS.sales_enrollment.description,
    systemPromptBase: SCENARIOS.sales_enrollment.systemPrompt,
    firstMessage: 'Yeah, the class was really good! I liked it.',
    voiceProvider: 'vapi',
    voiceId: 'Cole',
    scoringRubricType: 'salesEnrollment',
    scoringCategories: SCORING_RUBRICS.salesEnrollment,
    status: 'published',
  },
  renewal_conference: {
    slug: 'renewal_conference',
    title: SCENARIOS.renewal_conference.title,
    description: SCENARIOS.renewal_conference.description,
    systemPromptBase: SCENARIOS.renewal_conference.systemPrompt,
    firstMessage: "Yeah, Tyler's been really enjoying it. I'm glad we tried it.",
    voiceProvider: 'vapi',
    voiceId: 'Savannah',
    scoringRubricType: 'renewal',
    scoringCategories: SCORING_RUBRICS.renewal,
    status: 'published',
  },
  student_advancement: {
    slug: 'student_advancement',
    title: SCENARIOS.student_advancement.title,
    description: SCENARIOS.student_advancement.description,
    systemPromptBase: SCENARIOS.student_advancement.systemPrompt,
    firstMessage: "Yeah, Maya has been really enjoying classes. The instructor said you wanted to talk with us about her progress?",
    voiceProvider: 'vapi',
    voiceId: 'Paige',
    scoringRubricType: 'studentAdvancement',
    scoringCategories: SCORING_RUBRICS.studentAdvancement,
    status: 'published',
  },
  cancellation_save: {
    slug: 'cancellation_save',
    title: SCENARIOS.cancellation_save.title,
    description: SCENARIOS.cancellation_save.description,
    systemPromptBase: SCENARIOS.cancellation_save.systemPrompt,
    firstMessage: "Hi, I'm calling because I need to cancel Cameron's membership.",
    voiceProvider: 'vapi',
    voiceId: 'Leah',
    scoringRubricType: 'cancellation',
    scoringCategories: SCORING_RUBRICS.cancellation,
    status: 'published',
  },
};

export function getBuiltInScenarioDefault(slug) {
  return BUILT_IN_SCENARIO_DEFAULTS[slug] ?? null;
}

const OBJECTION_FOCUS = {
  easy: {
    new_student: [
      'Light schedule question: ask which evenings are available.',
      'Light confidence concern: mention you are a little nervous about starting.',
      'Light price question: ask if there is an intro offer.',
    ],
    parent_enrollment: [
      'Light schedule question: ask what days kids classes usually run.',
      'Light child-fit concern: ask if shy kids usually do okay.',
      'Light price question: ask whether there is a trial or intro offer.',
    ],
    web_lead_callback: [
      'Light context question: ask what the intro offer includes.',
      'Light schedule question: ask what class times are usually available.',
      'Light comfort concern: mention you have never tried martial arts before.',
    ],
    kids_web_lead_callback: [
      'Light child-fit question: ask if shy kids usually do okay in the first class.',
      'Light schedule question: ask what kids class times are usually available.',
      'Light trial question: ask whether there is an intro class or beginner option.',
    ],
    sales_enrollment: [
      'Light schedule question: ask which class times are best after the trial.',
      'Light commitment concern: ask how often most kids attend.',
      'Light price question: ask what the starter option is.',
    ],
    renewal_conference: [
      'Light schedule question: ask if class times will stay the same.',
      'Light value question: ask what the next stage of progress looks like.',
      'Light price question: ask whether renewal pricing changes.',
    ],
    student_advancement: [
      'Light readiness question: ask what made the instructors think Maya is ready.',
      'Light schedule question: ask when the recommendation class is offered.',
      'Light program question: ask what is different about the next level.',
    ],
    cancellation_save: [
      'Light schedule concern: Cameron started another activity, but a different class time might help.',
      'Light motivation concern: Cameron has been less excited lately.',
      'Light budget question: ask if there are any short-term options.',
    ],
  },
  medium: {
    new_student: [
      'Mild price question: ask whether there is an intro offer or what the monthly range usually is.',
      'Mild commitment concern: mention you have started fitness plans before and fallen off.',
      'Mild schedule concern: ask which evenings are available before agreeing to visit.',
    ],
    parent_enrollment: [
      'Mild price question: ask about monthly cost before booking.',
      "Mild other-parent concern: say you may need to run this by Marcus's other parent.",
      "Mild schedule concern: ask whether class times fit around Marcus's current activities.",
    ],
    web_lead_callback: [
      'Mild price question: ask what it usually costs before agreeing to come in.',
      'Mild partner concern: say you probably need to check with your partner before putting anything on the calendar.',
      'Mild comparison concern: mention you are looking at a couple of schools.',
      'Mild schedule concern: ask for class time options because work can run late.',
    ],
    kids_web_lead_callback: [
      'Mild price question: ask whether there is a trial or intro offer before booking.',
      "Mild other-parent concern: say you probably need to check with Ava's other parent before putting anything on the calendar.",
      'Mild child-fit concern: ask how they help shy kids feel comfortable in the first class.',
      'Mild schedule concern: ask whether kids classes fit around school pickup and homework.',
    ],
    sales_enrollment: [
      'Mild price concern: say the membership is a little more than expected.',
      'Mild other-parent concern: say you should check with the other parent before deciding.',
      'Mild schedule concern: ask whether the schedule will still work when activities change.',
    ],
    renewal_conference: [
      'Mild price concern: ask whether the renewal price is changing.',
      'Mild other-parent concern: say you need to talk it over before renewing.',
      "Mild schedule concern: ask whether Tyler's class options will still work next season.",
    ],
    student_advancement: [
      'Mild readiness concern: say you are proud of Maya but are not sure she is ready for a faster-paced class.',
      'Mild schedule concern: ask whether adding another class will be realistic with school and family commitments.',
      'Mild pressure concern: ask whether this is truly based on readiness or if everyone eventually gets offered it.',
    ],
    cancellation_save: [
      'Mild schedule concern: Cameron started another activity, but a different class time might help.',
      'Mild price concern: money is tighter this month.',
      'Mild motivation concern: Cameron has been less excited lately.',
    ],
  },
  hard: {
    new_student: [
      'Primary blocker: price/budget. You are interested, but you need to understand the monthly cost before you can consider visiting.',
      'Primary blocker: schedule uncertainty. Your work schedule changes week to week, so you need class time options before committing.',
      'Primary blocker: commitment concern. You have started fitness plans before and stopped showing up, so you are hesitant to commit.',
      'Primary blocker: comparison shopping. You are checking out a few options and do not want to be pushed into an appointment.',
    ],
    parent_enrollment: [
      "Primary blocker: other-parent decision. You need to talk to Marcus's other parent before booking anything.",
      "Primary blocker: price/budget. You are interested, but you need to know whether the program fits the family's budget.",
      "Primary blocker: schedule uncertainty. Marcus already has a busy schedule, so you need class time options before committing.",
      'Primary blocker: child fit. You are unsure whether Marcus will actually like it because he lost interest in soccer.',
    ],
    web_lead_callback: [
      'Primary blocker: price/budget. You worry this will cost more than expected and do not want a surprise sales pitch.',
      'Primary blocker: partner decision. You want to check with your partner before committing to a visit.',
      'Primary blocker: comparison shopping. You are comparing several schools and do not want pressure.',
      'Primary blocker: schedule uncertainty. You need class time options before committing.',
    ],
    kids_web_lead_callback: [
      "Primary blocker: other-parent decision. You need to talk to Ava's other parent before booking anything.",
      'Primary blocker: child fit. Ava is shy, and you are worried she will shut down if the first class feels intimidating.',
      'Primary blocker: schedule uncertainty. Weekdays are tight because of school pickup and homework, so you need class time options.',
      'Primary blocker: price/budget. You want to understand the intro offer or trial cost before agreeing to visit.',
    ],
    sales_enrollment: [
      'Primary blocker: price/budget. The membership is more than expected and you need to understand the value before deciding.',
      'Primary blocker: other-parent decision. You need to talk to the other parent before making a membership decision.',
      'Primary blocker: schedule uncertainty. You are unsure the class schedule will work once school activities start.',
      'Primary blocker: commitment length. You are nervous about committing to a full program before knowing your child will stick with it.',
    ],
    renewal_conference: [
      'Primary blocker: price/value. You need to understand why renewing is worth it before committing again.',
      'Primary blocker: other-parent decision. You need to talk to the other parent before renewing.',
      "Primary blocker: schedule uncertainty. Tyler's school schedule may change soon, so you need to confirm class times.",
      'Primary blocker: progress doubt. You like the program, but you are not fully convinced the progress is strong enough to renew yet.',
    ],
    student_advancement: [
      'Primary blocker: readiness. You worry Maya may not be mature or confident enough for the next level yet.',
      'Primary blocker: pressure concern. You are guarded because this could feel like a sales pitch instead of a true instructor recommendation.',
      'Primary blocker: schedule uncertainty. Additional classes may be difficult with school and family commitments.',
      'Primary blocker: value clarity. You need to understand how this supports Maya long term before attending a recommendation class.',
    ],
    cancellation_save: [
      'Primary blocker: motivation. Cameron has been resistant about coming for a month.',
      'Primary blocker: schedule conflict. Cameron started another activity and the current class time no longer works.',
      'Primary blocker: budget pressure. Money is tight and you are looking for expenses to cut.',
      'Primary blocker: value doubt. You are not sure Cameron is getting enough out of the program anymore.',
    ],
  },
};

function getDefaultObjectionFocus(slug) {
  return {
    easy: OBJECTION_FOCUS.easy?.[slug] ?? [],
    medium: OBJECTION_FOCUS.medium?.[slug] ?? [],
    hard: OBJECTION_FOCUS.hard?.[slug] ?? [],
  };
}

for (const scenario of Object.values(BUILT_IN_SCENARIO_DEFAULTS)) {
  scenario.objectionFocus = getDefaultObjectionFocus(scenario.slug);
  scenario.objectionCounts = normalizeObjectionCounts();
}

function selectObjectionFocus(scenarioId, difficulty, objectionFocusOverride = null, objectionCountsOverride = null) {
  const source = objectionFocusOverride || OBJECTION_FOCUS;
  const options = Array.isArray(source?.[difficulty])
    ? source[difficulty]
    : source?.[difficulty]?.[scenarioId];
  const count = normalizeObjectionCounts(objectionCountsOverride)[difficulty];
  if (!options?.length || count <= 0) return { prompt: '', selectedCount: 0 };
  const selected = [...options]
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
  return {
    prompt: `
## Selected Objections for This Call
${selected.map((objection, index) => `${index + 1}. ${objection}`).join('\n')}
- Use only these selected objections for this call.
- If multiple objections are listed, raise them naturally across the conversation instead of all at once.
- Do not invent a different main objection unless the staff member directly creates a new concern.
- Do not default to schedule unless a selected objection specifically says schedule.
`,
    selectedCount: selected.length,
  };
}

export function getScenarioSystemPrompt(scenarioId, school, difficulty = 'medium', basePromptOverride = null, objectionFocusOverride = null, objectionCountsOverride = null) {
  const base = basePromptOverride || SCENARIOS[scenarioId]?.systemPrompt || SCENARIOS.new_student.systemPrompt;
  const selectedDifficulty = DIFFICULTY_MODIFIERS[difficulty] ? difficulty : 'medium';
  const objectionFocus = selectObjectionFocus(scenarioId, selectedDifficulty, objectionFocusOverride, objectionCountsOverride);
  const difficultyBlock = DIFFICULTY_MODIFIERS[selectedDifficulty](objectionFocus.selectedCount);
  if (!school) return base + objectionFocus.prompt + difficultyBlock;

  const schoolName = school.schoolName || school.name || 'the school';
  const address = [school.streetAddress, school.city, school.state].filter(Boolean).join(', ') || 'their location';
  const offer = school.introOffer || 'a free trial class';
  const priceLine =
    school.priceRangeLow && school.priceRangeHigh
      ? `$${school.priceRangeLow} to $${school.priceRangeHigh} per month`
      : school.priceRangeLow
      ? `starting at $${school.priceRangeLow} per month`
      : 'varies by program';
  const director = school.programDirectorName || 'the program director';

  const schoolContext = `
## What You Know About This School
You know you are contacting ${schoolName} at ${address}. They offer ${offer}. Pricing is ${priceLine}. The program director is ${director}.
Use these details naturally when relevant — don't recite them unprompted.
`;
  return base + schoolContext + objectionFocus.prompt + difficultyBlock;
}
