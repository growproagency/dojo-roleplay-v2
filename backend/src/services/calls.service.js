import { findCallsByUser, findCallsBySchool, findCallsBySchoolAndUser, findCallById, updateCall } from '../db/calls.queries.js';
import { findScorecardByCallId, insertScorecard } from '../db/scorecards.queries.js';
import { findCustomScenarioBySlug } from '../db/scenarios.queries.js';
import { findSchoolById } from '../db/schools.queries.js';
import { scoreCallTranscript } from './scoring.service.js';
import { getPublishedBuiltInScenarios } from './scenarios.service.js';
import { SCENARIOS } from '../data/scenarios.js';
import { canUseCustomScenarios } from '../utils/plans.js';
import { isScoreableTranscriptTurns, parseTranscriptTurns } from '../utils/transcriptQuality.js';
function isGlobalAdmin(user) { return user?.role === 'global_admin' || user?.role === 'admin'; }
function isSchoolAdmin(user) { return user?.role === 'school_admin'; }

function canAccessCall(user, call) {
  if (!call) return false;
  if (isGlobalAdmin(user)) return true;
  if (isSchoolAdmin(user)) return call.schoolId === user.schoolId;
  return call.userId === user.id;
}

async function schoolCanUseCustomScenarios(schoolId) {
  if (!schoolId) return false;
  const school = await findSchoolById(schoolId).catch(() => null);
  return canUseCustomScenarios(school);
}

export async function listCalls({ user, schoolId, scope = 'school', userId = null }) {
  if (isGlobalAdmin(user)) {
    if (!schoolId) return findCallsByUser(user.id);
    if (userId) return findCallsBySchoolAndUser(schoolId, userId);
    return findCallsBySchool(schoolId);
  }

  if (isSchoolAdmin(user)) {
    if (!schoolId) return [];
    if (scope === 'mine') return findCallsByUser(user.id);
    if (userId) return findCallsBySchoolAndUser(schoolId, userId);
    return findCallsBySchool(schoolId);
  }

  return findCallsByUser(user.id);
}

export async function getCall(callId, user) {
  const call = await findCallById(callId);
  if (!canAccessCall(user, call)) throw new Error('NOT_FOUND');
  const scorecard = await findScorecardByCallId(call.id);
  return { call, scorecard: scorecard ?? null };
}

export async function triggerScoring(callId, user) {
  const call = await findCallById(callId);
  if (!canAccessCall(user, call)) throw new Error('NOT_FOUND');
  const turns = call.transcriptTurns?.length ? call.transcriptTurns : parseTranscriptTurns(call.transcription);
  if (!isScoreableTranscriptTurns(turns)) {
    throw new Error('CALL_NOT_SCOREABLE');
  }

  let scenarioTitle = SCENARIOS[call.scenario]?.title || call.scenario;
  let customScoringPrompt = null;
  let scoringCategories = null;

  if (SCENARIOS[call.scenario]) {
    const builtIn = (await getPublishedBuiltInScenarios()).find((scenario) => scenario.slug === call.scenario);
    if (builtIn) {
      scenarioTitle = builtIn.title;
      scoringCategories = builtIn.scoringCategories;
    }
  }

  if (!SCENARIOS[call.scenario] && await schoolCanUseCustomScenarios(call.schoolId ?? null)) {
    const custom = await findCustomScenarioBySlug(call.scenario, call.schoolId ?? null).catch(() => null);
    if (custom) {
      scenarioTitle = custom.title;
      customScoringPrompt = custom.scoringPrompt;
    }
  }

  await updateCall(call.id, { status: 'scoring' });

  try {
    const result = await scoreCallTranscript(call.transcription, scenarioTitle, customScoringPrompt, call.difficulty, scoringCategories);
    await insertScorecard({
      callId: call.id,
      overallScore: result.overallScore,
      categories: result.categories,
      highlights: result.highlights,
      missedOpportunities: result.missedOpportunities,
      suggestions: result.suggestions,
      summary: result.summary,
      model: result._meta?.model,
    });
    await updateCall(call.id, { status: 'scored' });
    return { success: true };
  } catch (err) {
    await updateCall(call.id, { status: 'completed' });
    throw err;
  }
}
