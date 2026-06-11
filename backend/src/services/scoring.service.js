import OpenAI from 'openai';
import { config } from '../config/env.js';
import { findPlatformSettings } from '../db/platform.queries.js';
import { resolveOverallScore } from '../utils/scoreNormalization.js';

let _client = null;
function getClient() {
  if (!_client) _client = new OpenAI({ apiKey: config.openaiApiKey });
  return _client;
}

const INBOUND_PROMPT = `You are an expert sales coach for martial arts schools evaluating an inbound inquiry call.

## The 13-Step Inbound Call Script:
1. Greeting — warm energy, got full name, school intro
2. Identify Caller — for self or child? Child's age?
3. Confirm Location
4. Determine Lead Source — how did they hear about us?
5. Identify Desired Benefits (WHY) — probe deeper if vague
6. Current Efforts — any previous training?
7. Position the School — address their specific WHY
8. Present the Offer — free trial, intro offer
9. Schedule the Appointment — specific time slots
10. Gather Information — name, email, phone
11. Ask for Referrals
12. Pre-Frame the Sign-Up — "if you like what you see, we can get you signed up — fair enough?"
13. Provide Next Steps — what to wear, bring, logistics

Score on 6 categories (0–10):
1. Rapport & Greeting (10%)
2. Needs Discovery (20%)
3. School Positioning & Offer (20%)
4. Objection Handling (20%)
5. Appointment Setting (20%)
6. Information Gathering & Referrals (10%)

Return JSON: { overallScore, categories: [{name, score, feedback}], highlights, missedOpportunities, suggestions, summary }`;

const OUTBOUND_PROMPT = `You are an expert sales coach evaluating an outbound web lead callback.

## The 12-Step Outbound Callback Script:
1. Warm Introduction — introduce self and school
2. Reference the Form — establish context
3. Establish Rapport — genuine questions before pitching
4. Identify WHY — what are they hoping to get?
5. Handle Cold Open / Skepticism
6. Position the School
7. Present the Offer
8. Handle "Think About It"
9. Schedule the Appointment — specific time slots
10. Gather Information
11. Pre-Frame the Visit
12. Confirm Next Steps

Score on 6 categories (0–10):
1. Rapport & Introduction (20%)
2. Needs Discovery (20%)
3. School Positioning & Offer (15%)
4. Objection Handling (20%)
5. Appointment Setting (15%)
6. Information & Next Steps (10%)

Return JSON: { overallScore, categories: [{name, score, feedback}], highlights, missedOpportunities, suggestions, summary }`;

const SALES_ENROLLMENT_PROMPT = `You are an expert sales coach evaluating a Sales Enrollment Conference (post-trial sit-down).

## The 4-Step Enrollment Process:
1. Talk About the Student (Go Fishing) — ask about goals BEFORE pitching
2. Teach the Benefit (Over Time) — explain HOW the program builds the specific benefit
3. Pre-Frame the Upgrade (Compare & Contrast) — reference advanced students, ask commitment question
4. Present Pricing (Conversation) — conversational, lead with savings, ask "Which option works best?"

Score on 6 categories (0–10):
1. Needs Discovery / Go Fishing (25%)
2. Benefit Teaching / Over Time (20%)
3. Upgrade Pre-Frame (15%)
4. Pricing Presentation (15%)
5. Objection Handling (15%)
6. Closing Technique (10%)

Return JSON: { overallScore, categories: [{name, score, feedback}], highlights, missedOpportunities, suggestions, summary }`;

const RENEWAL_PROMPT = `You are an expert retention coach evaluating a Program Renewal Conference.

## The 4-Step Renewal Process:
1. Book the Progress Check — frame as structured check-in, not a sales call
2. Ask the 3 Questions — Q1: how is student enjoying it? Q2: what have YOU noticed at home? Q3: can you see them accomplishing [benefit] if we stay consistent?
3. Highlight Specific Progress — 1-2 real, specific observations
4. Present the Renewal — direct, confident ask; go silent after asking

Score on 6 categories (0–10):
1. Progress Check Framing (15%)
2. The 3 Questions (30%)
3. Specific Progress Highlight (20%)
4. Renewal Ask (20%)
5. Objection Handling (10%)
6. Follow-Up Discipline (5%)

Return JSON: { overallScore, categories: [{name, score, feedback}], highlights, missedOpportunities, suggestions, summary }`;

const CANCELLATION_PROMPT = `You are an expert retention coach evaluating a Cancellation Save call.

## The Cancellation Save Process:
1. Universal Opening — buy time, ask questions before processing
2. Identify the Real Reason — open-ended questions, probe deeper
3. Deploy the Right Save Tool — match the tool to the reason (cost, interest, schedule, etc.)
4. Extended Time Guarantee (ETG) — explain clearly when relevant
5. Close or Graceful Exit — concrete solution or warm exit

Score on 5 categories (0–10):
1. Universal Opening (20%)
2. Reason Discovery (25%)
3. Save Strategy (25%)
4. ETG Deployment (15%)
5. Close or Exit Quality (15%)

Return JSON: { overallScore, categories: [{name, score, feedback}], highlights, missedOpportunities, suggestions, summary }`;

const SCORE_SCALE_INSTRUCTIONS = `

## Score Scale
- Category scores must be from 0 to 10.
- overallScore must be from 0 to 100.`;

function buildCustomPrompt(customScoringPrompt) {
  return `You are an expert roleplay coach evaluating a custom training scenario.

## Custom Scoring Rubric
Use this rubric as the PRIMARY scoring standard:
${customScoringPrompt}

## Scoring Rules
- The custom rubric overrides any default martial arts call script expectations.
- Do NOT penalize the staff for missing inbound, outbound, enrollment, renewal, or cancellation script steps unless the custom rubric asks for those steps.
- If the custom rubric says a specific action earns a perfect score, then set overallScore to 100 when that action is present in the transcript.
- If the custom rubric is short, create 1-4 relevant categories from it and score each category from 0 to 10.
- Keep feedback concise and tied directly to the custom rubric.

Return JSON: { overallScore, categories: [{name, score, feedback}], highlights, missedOpportunities, suggestions, summary }`;
}

function selectScoringPrompt(scenarioTitle, customScoringPrompt) {
  if (customScoringPrompt) return buildCustomPrompt(customScoringPrompt) + SCORE_SCALE_INSTRUCTIONS;

  const t = (scenarioTitle || '').toLowerCase();
  let basePrompt = INBOUND_PROMPT;
  if (t.includes('cancellation')) basePrompt = CANCELLATION_PROMPT;
  else if (t.includes('renewal')) basePrompt = RENEWAL_PROMPT;
  else if (t.includes('enrollment') || t.includes('conference')) basePrompt = SALES_ENROLLMENT_PROMPT;
  else if (t.includes('outbound') || t.includes('callback')) basePrompt = OUTBOUND_PROMPT;
  return basePrompt + SCORE_SCALE_INSTRUCTIONS;
}

export async function scoreCallTranscript(transcript, scenarioTitle, customScoringPrompt = null) {
  const systemPrompt = selectScoringPrompt(scenarioTitle, customScoringPrompt);

  const settings = await findPlatformSettings().catch(() => null);
  const model = settings?.defaultModel || config.openaiModel;

  const response = await getClient().chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Scenario: ${scenarioTitle}\n\nTranscript:\n${transcript}\n\nEvaluate this call and return the JSON scorecard.` },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'scorecard',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            overallScore: { type: 'number' },
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: { name: { type: 'string' }, score: { type: 'number' }, feedback: { type: 'string' } },
                required: ['name', 'score', 'feedback'],
                additionalProperties: false,
              },
            },
            highlights: { type: 'array', items: { type: 'string' } },
            missedOpportunities: { type: 'array', items: { type: 'string' } },
            suggestions: { type: 'array', items: { type: 'string' } },
            summary: { type: 'string' },
          },
          required: ['overallScore', 'categories', 'highlights', 'missedOpportunities', 'suggestions', 'summary'],
          additionalProperties: false,
        },
      },
    },
    max_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No scoring response from LLM');
  const parsed = JSON.parse(content);
  parsed.overallScore = resolveOverallScore({
    overallScore: parsed.overallScore,
    categories: parsed.categories,
    scenarioTitle,
    customScoringPrompt,
  });
  if (parsed.overallScore == null) throw new Error('Invalid scoring response from LLM');
  parsed._meta = { model: response.model, promptTokens: response.usage?.prompt_tokens, completionTokens: response.usage?.completion_tokens };
  return parsed;
}
