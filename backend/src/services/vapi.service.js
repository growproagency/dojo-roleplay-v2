import { findCallByVapiId, insertCall, updateCall } from '../db/calls.queries.js';
import { insertScorecard } from '../db/scorecards.queries.js';
import { findBuiltInScenarioBySlug, findCustomScenarioBySlug, findCustomScenarios } from '../db/scenarios.queries.js';
import { findSchoolById } from '../db/schools.queries.js';
import { countRecentPhoneAttempts, logPhoneCallAttempt } from '../db/phoneCallAttempts.queries.js';
import { findUserByPhoneNumber } from '../db/users.queries.js';
import { verifySessionToken } from '../utils/sessionToken.js';
import { scoreCallTranscript } from './scoring.service.js';
import { assertSchoolMonthlyMinutesAvailable } from './usageLimits.service.js';
import { getPublishedBuiltInScenarios } from './scenarios.service.js';
import { SCENARIOS, getBuiltInScenarioDefault, getScenarioSystemPrompt } from '../data/scenarios.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';
import { countWords, isScoreableTranscriptTurns } from '../utils/transcriptQuality.js';
import { canUseCustomScenarios } from '../utils/plans.js';

const callContextCache = new Map();

function setCtx(id, ctx) { if (id && ctx) callContextCache.set(id, ctx); }
function getCtx(id) { return id ? (callContextCache.get(id) || null) : null; }
function clearCtx(id) { if (id) callContextCache.delete(id); }

async function schoolCanUseCustomScenarios(schoolId) {
  if (!schoolId) return false;
  const school = await findSchoolById(schoolId).catch(() => null);
  return canUseCustomScenarios(school);
}

function isGlobalAdmin(user) {
  return user?.role === 'global_admin' || user?.role === 'admin';
}

function buildRejectionAssistant(message) {
  return {
    model: {
      provider: 'openai',
      model: config.openaiModel,
      messages: [{
        role: 'system',
        content: 'Say the first message exactly as written, then stop talking. Do not continue the conversation.',
      }],
    },
    voice: { provider: 'vapi', voiceId: 'Elliot' },
    firstMessage: message,
    maxDurationSeconds: 20,
    silenceTimeoutSeconds: 10,
  };
}

function extractMetadata(message) {
  const call = message?.call || {};
  return {
    ...(message?.metadata || {}),
    ...(message?.assistantOverrides?.metadata || {}),
    ...(message?.assistant?.metadata || {}),
    ...(call.metadata || {}),
    ...(call.assistantOverrides?.metadata || {}),
    ...(call.assistant?.metadata || {}),
  };
}

async function resolveTenant(message) {
  const call = message?.call;
  const vapiCallId = call?.id;
  const cached = getCtx(vapiCallId);
  if (cached) return cached;

  const metadata = extractMetadata(message);
  if (metadata.sessionToken) {
    const payload = verifySessionToken(metadata.sessionToken);
    if (payload?.userId) {
      const ctx = { userId: payload.userId, schoolId: payload.schoolId ?? null };
      setCtx(vapiCallId, ctx);
      logger.info({ type: message?.type, vapiCallId, userId: ctx.userId, schoolId: ctx.schoolId }, 'Resolved Vapi tenant from session token');
      return ctx;
    }
    logger.warn({ type: message?.type, vapiCallId }, 'Vapi session token was present but invalid or expired');
  }

  const callerNumber = call?.customer?.number;
  if (callerNumber) {
    const user = await findUserByPhoneNumber(callerNumber).catch(() => null);
    if (user) {
      const ctx = { userId: user.id, schoolId: user.schoolId ?? null };
      setCtx(vapiCallId, ctx);
      logger.info({ type: message?.type, vapiCallId, userId: ctx.userId, schoolId: ctx.schoolId }, 'Resolved Vapi tenant from caller phone number');
      return ctx;
    }
  }

  if (vapiCallId) {
    const dbCall = await findCallByVapiId(vapiCallId).catch(() => null);
    if (dbCall?.userId) {
      const ctx = { userId: dbCall.userId, schoolId: dbCall.schoolId ?? null };
      setCtx(vapiCallId, ctx);
      logger.info({ type: message?.type, vapiCallId, userId: ctx.userId, schoolId: ctx.schoolId }, 'Resolved Vapi tenant from existing call row');
      return ctx;
    }
  }

  logger.warn({
    type: message?.type,
    vapiCallId,
    metadataKeys: Object.keys(metadata),
    hasCustomerNumber: !!callerNumber,
  }, 'Unable to resolve Vapi tenant');
  return null;
}

async function handleAssistantRequest(message) {
  const call = message?.call;
  const vapiCallId = call?.id;
  const callType = call?.type;

  if (callType === 'inboundPhoneCall') {
    const callerNumber = call?.customer?.number;

    if (!callerNumber) {
      logger.warn({ type: message?.type, vapiCallId }, 'Inbound phone call missing caller number');
      return {
        assistant: buildRejectionAssistant(
          'Sorry, your phone number could not be identified. Please try again from a different phone. Goodbye.'
        ),
      };
    }

    const recentAttempts = await countRecentPhoneAttempts(callerNumber, 60).catch((err) => {
      logger.warn({ err, callerNumber }, 'Failed to count recent phone attempts');
      return 0;
    });

    if (recentAttempts >= 5) {
      await logPhoneCallAttempt({ callerNumber, vapiCallId, outcome: 'rejected_rate_limit' }).catch((err) => {
        logger.warn({ err, callerNumber }, 'Failed to log rate-limited phone attempt');
      });
      return {
        assistant: buildRejectionAssistant('Too many calls from this number recently. Please try again later. Goodbye.'),
      };
    }

    const user = await findUserByPhoneNumber(callerNumber).catch((err) => {
      logger.warn({ err, callerNumber }, 'Phone user lookup failed');
      return null;
    });

    if (!user) {
      await logPhoneCallAttempt({ callerNumber, vapiCallId, outcome: 'rejected_unknown' }).catch((err) => {
        logger.warn({ err, callerNumber }, 'Failed to log unknown phone attempt');
      });
      return {
        assistant: buildRejectionAssistant(
          "Sorry, this number isn't registered with Dojo Roleplay. Please add your phone number in your account settings and try again. Goodbye."
        ),
      };
    }

    if (!user.schoolId && !isGlobalAdmin(user)) {
      await logPhoneCallAttempt({ callerNumber, vapiCallId, userId: user.id, outcome: 'rejected_unknown' }).catch((err) => {
        logger.warn({ err, callerNumber, userId: user.id }, 'Failed to log unassigned phone attempt');
      });
      return {
        assistant: buildRejectionAssistant(
          "Sorry, your account isn't assigned to a school yet. Please contact your administrator. Goodbye."
        ),
      };
    }

    if (user.schoolId) {
      const usageError = await assertSchoolMonthlyMinutesAvailable(user.schoolId).then(() => null).catch((err) => err);
      if (usageError) {
        await logPhoneCallAttempt({ callerNumber, vapiCallId, userId: user.id, schoolId: user.schoolId, outcome: 'rejected_usage_cap' }).catch((err) => {
          logger.warn({ err, callerNumber, userId: user.id }, 'Failed to log monthly-minute-limited phone attempt');
        });
        if (usageError.message === 'MONTHLY_MINUTES_LIMIT_REACHED') {
          return {
            assistant: buildRejectionAssistant(
              'Sorry, your school has reached its monthly roleplay minute limit. Please contact your administrator. Goodbye.'
            ),
          };
        }
        throw usageError;
      }
    }

    setCtx(vapiCallId, { userId: user.id, schoolId: user.schoolId ?? null });
    await logPhoneCallAttempt({
      callerNumber,
      vapiCallId,
      userId: user.id,
      schoolId: user.schoolId ?? null,
      outcome: 'accepted',
    }).catch((err) => {
      logger.warn({ err, callerNumber, userId: user.id }, 'Failed to log accepted phone attempt');
    });

    logger.info({
      type: message?.type,
      vapiCallId,
      userId: user.id,
      schoolId: user.schoolId ?? null,
      callerNumber,
    }, 'Accepted inbound Vapi phone call');

    return {
      assistant: await buildReceptionistAssistant(user.name, config.vapiWebhookUrl, user.schoolId ?? null),
    };
  }

  const metadata = extractMetadata(message);
  const tenant = await resolveTenant(message);
  const user = tenant ? { name: null } : null;
  return {
    assistant: await buildReceptionistAssistant(user?.name || null, config.vapiWebhookUrl, tenant?.schoolId ?? null, {
      selectedScenario: metadata.selectedScenario || null,
      selectedScenarioTitle: metadata.selectedScenarioTitle || null,
      selectedDifficulty: metadata.selectedDifficulty || null,
    }),
  };
}

async function buildReceptionistAssistant(userName, webhookUrl, schoolId = null, options = {}) {
  const customScenariosAllowed = await schoolCanUseCustomScenarios(schoolId);
  const customScenarios = customScenariosAllowed
    ? await findCustomScenarios(schoolId).catch(() => [])
    : [];
  const allScenarios = [
    ...(await getPublishedBuiltInScenarios()).map(s => ({ id: s.slug, title: s.title, description: s.description })),
    ...customScenarios.map(s => ({ id: s.slug, title: s.title, description: s.description })),
  ];

  const scenarioList = allScenarios.map((s, i) => `${i + 1}. ${s.title} - ${s.description}`).join('\n');
  const scenarioIds = allScenarios.map(s => s.id);
  const selectedScenario = scenarioIds.includes(options.selectedScenario) ? options.selectedScenario : null;
  const selectedScenarioTitle = selectedScenario
    ? options.selectedScenarioTitle || allScenarios.find(s => s.id === selectedScenario)?.title || selectedScenario
    : null;
  const selectedDifficulty = normalizeDifficulty(options.selectedDifficulty);
  const greeting = userName
    ? selectedScenarioTitle && selectedDifficulty
      ? `Hi ${userName}! Starting ${selectedScenarioTitle} on ${selectedDifficulty} difficulty.`
      : selectedScenarioTitle
      ? `Hi ${userName}! You selected ${selectedScenarioTitle}. What difficulty would you like: easy, medium, or hard?`
      : `Hi ${userName}! Which scenario and difficulty (easy, medium, or hard) would you like to practice?`
    : selectedScenarioTitle && selectedDifficulty
      ? `Starting ${selectedScenarioTitle} on ${selectedDifficulty} difficulty.`
      : selectedScenarioTitle
      ? `You selected ${selectedScenarioTitle}. What difficulty would you like: easy, medium, or hard?`
      : 'Welcome to Dojo Roleplay! Which scenario and difficulty would you like to practice?';

  const selectedScenarioInstruction = selectedScenario
    ? selectedDifficulty
      ? `\n\nThe scenario is already selected: ${selectedScenarioTitle} (${selectedScenario}). The difficulty is already selected: ${selectedDifficulty}. Do not ask which scenario or difficulty they want. Call handoff_tool immediately with scenario "${selectedScenario}" and difficulty "${selectedDifficulty}".`
      : `\n\nThe scenario is already selected: ${selectedScenarioTitle} (${selectedScenario}). Do not ask which scenario they want. Ask only for difficulty. When you call handoff_tool, set scenario to "${selectedScenario}".`
    : '';

  const assistant = {
    model: {
      provider: 'openai',
      model: config.openaiModel,
      messages: [{
        role: 'system',
        content: `You are a receptionist for Dojo Roleplay. Find out which training scenario and difficulty the caller wants, then call handoff_tool.${selectedScenarioInstruction}\n\nAvailable scenarios:\n${scenarioList}\n\nDifficulties: Easy, Medium, Hard. Accept clear synonyms like beginner/easier for easy, normal/regular for medium, and difficult/advanced/challenging/tough for hard. If the difficulty is unclear or not one of those meanings, ask again and do not call handoff_tool yet.`,
      }],
      tools: webhookUrl ? [{
        type: 'handoff',
        function: {
          name: 'handoff_tool',
          description: 'Transfer to training scenario after a clear scenario and difficulty choice.',
          parameters: {
            type: 'object',
            properties: {
              destination: { type: 'string', enum: ['dynamic'] },
              scenario: { type: 'string', enum: scenarioIds },
              difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
            },
            required: ['destination', 'scenario', 'difficulty'],
          },
        },
        destinations: [{ type: 'dynamic', server: { url: webhookUrl } }],
      }] : undefined,
    },
    transcriber: {
      provider: 'deepgram',
      model: 'nova-2',
      language: 'en',
      endpointing: 300,
      confidenceThreshold: 0.2,
      keywords: ['easy', 'medium', 'hard', 'tough', 'difficult', 'advanced', 'challenging'],
    },
    backgroundSpeechDenoisingPlan: {
      smartDenoisingPlan: { enabled: false },
      fourierDenoisingPlan: { enabled: false },
    },
    voice: { provider: 'vapi', voiceId: 'Elliot' },
    firstMessage: greeting,
    firstMessageInterruptionsEnabled: true,
    serverMessages: ['end-of-call-report', 'status-update', 'handoff-destination-request'],
    silenceTimeoutSeconds: 60,
  };

  if (webhookUrl) {
    assistant.server = { url: webhookUrl, timeoutSeconds: 20 };
  }

  return assistant;
}

function buildCustomScenarioPrompt(scenario, schoolSettings, difficulty) {
  const roleMap = {
    inbound: 'You are a real person calling a martial arts school. You are the prospect, not the staff.',
    inbound_call: 'You are a real person calling a martial arts school. You are the prospect, not the staff.',
    outbound_callback: 'You are receiving a call from a martial arts school because you submitted interest.',
    in_person: 'You are sitting in front of a staff member at a martial arts school.',
  };

  const base = `
## Your Role
${roleMap[scenario.contextType] || roleMap.inbound}

## Custom Scenario Priority
The custom scenario below is the source of truth for this roleplay.
- Follow the custom character prompt more strongly than any general martial arts school context.
- Do NOT default to asking about classes, programs, trials, pricing, or enrollment unless the custom scenario says that is why you are calling OR the staff brings it up first.
- If the custom scenario gives a specific personality, goal, secret, phrase, or success condition, stay focused on that.
- Never act like the default adult student inquiry scenario unless this custom scenario explicitly describes that situation.

## Who You Are
Your name is ${scenario.characterName || 'the prospect'}.
${scenario.characterBlurb || ''}

## Scenario
${scenario.characterPrompt}

## Opening Line
Say only this, then wait: "${scenario.openingLine || 'Hello?'}"
`;

  return getScenarioSystemPrompt('new_student', schoolSettings, difficulty, base);
}

async function resolveScenarioForCall(scenarioSlug, schoolId) {
  const builtIn = SCENARIOS[scenarioSlug];
  if (builtIn) {
    const dbBuiltIn = await findBuiltInScenarioBySlug(scenarioSlug).catch(() => null);
    const defaults = getBuiltInScenarioDefault(scenarioSlug);
    const published = dbBuiltIn?.status === 'published' ? dbBuiltIn : null;
    const title = published?.title || defaults?.title || builtIn.title;
    const systemPromptBase = published?.systemPromptBase || defaults?.systemPromptBase || builtIn.systemPrompt;
    const firstMessage = published
      ? published.firstMessage ?? defaults?.firstMessage ?? 'Hello?'
      : defaults?.firstMessage ?? 'Hello?';
    return {
      slug: scenarioSlug,
      title,
      systemPromptBase,
      voice: {
        provider: published?.voiceProvider || defaults?.voiceProvider || 'vapi',
        voiceId: published?.voiceId || defaults?.voiceId || 'Elliot',
      },
      firstMessage,
      scoringPrompt: null,
    };
  }

  const customScenariosAllowed = await schoolCanUseCustomScenarios(schoolId);
  const custom = customScenariosAllowed
    ? await findCustomScenarioBySlug(scenarioSlug, schoolId).catch(() => null)
    : null;
  if (!custom) return null;

  return {
    slug: custom.slug,
    title: custom.title,
    custom,
    voice: { provider: custom.voiceProvider || 'vapi', voiceId: custom.voiceId || 'Elliot' },
    firstMessage: custom.openingLine || 'Hello?',
    scoringPrompt: custom.scoringPrompt || null,
  };
}

export async function buildScenarioWebAssistant({ user, scenario, difficulty }) {
  const normalizedDifficulty = normalizeDifficulty(difficulty);
  if (!normalizedDifficulty) throw new Error('VALIDATION');

  const tenantSchoolId = user?.schoolId ?? null;
  const scenarioConfig = await resolveScenarioForCall(scenario, tenantSchoolId);
  if (!scenarioConfig) throw new Error('NOT_FOUND');

  const school = tenantSchoolId ? await findSchoolById(tenantSchoolId).catch(() => null) : null;
  const schoolSettings = school ? {
    schoolName: school.name,
    streetAddress: school.streetAddress,
    city: school.city,
    state: school.state,
    introOffer: school.introOffer,
    priceRangeLow: school.priceRangeLow,
    priceRangeHigh: school.priceRangeHigh,
    programDirectorName: school.programDirectorName,
  } : null;
  const systemPrompt = scenarioConfig.custom
    ? buildCustomScenarioPrompt(scenarioConfig.custom, schoolSettings, normalizedDifficulty)
    : getScenarioSystemPrompt(scenario, schoolSettings, normalizedDifficulty, scenarioConfig.systemPromptBase);
  const assistant = {
    name: scenarioConfig.title.slice(0, 40),
    model: { provider: 'openai', model: config.openaiModel, messages: [{ role: 'system', content: systemPrompt }] },
    voice: scenarioConfig.voice,
    firstMessage: scenarioConfig.firstMessage,
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 600,
    serverMessages: ['end-of-call-report', 'status-update'],
  };
  if (config.vapiWebhookUrl) assistant.server = { url: config.vapiWebhookUrl, timeoutSeconds: 20 };
  return assistant;
}

async function ensureCallStarted(message, fallback = {}) {
  const call = message?.call;
  const vapiCallId = call?.id;
  if (!vapiCallId) {
    logger.warn({ type: message?.type }, 'Vapi webhook missing call id; cannot create call row');
    return null;
  }

  const existing = await findCallByVapiId(vapiCallId).catch(() => null);
  if (existing) return existing;

  const tenant = await resolveTenant(message);
  if (!tenant?.userId) {
    logger.warn({ type: message?.type, vapiCallId }, 'Skipping call insert because tenant was not resolved');
    return null;
  }

  const id = await insertCall({
    userId: tenant.userId,
    schoolId: tenant.schoolId,
    scenario: fallback.scenario || 'new_student',
    difficulty: fallback.difficulty || 'medium',
    vapiCallId,
    status: 'in_progress',
  });

  logger.info({
    type: message?.type,
    callId: id,
    vapiCallId,
    userId: tenant.userId,
    schoolId: tenant.schoolId ?? null,
    scenario: fallback.scenario || 'new_student',
    difficulty: fallback.difficulty || 'medium',
  }, 'Inserted Vapi call row');

  return {
    id,
    userId: tenant.userId,
    schoolId: tenant.schoolId ?? null,
    scenario: fallback.scenario || 'new_student',
    difficulty: fallback.difficulty || 'medium',
    vapiCallId,
    status: 'in_progress',
  };
}

function parseToolArguments(args) {
  if (!args) return {};
  if (typeof args === 'string') {
    try {
      return JSON.parse(args);
    } catch {
      return {};
    }
  }
  return args;
}

function normalizeDifficulty(value) {
  if (!value) return null;
  const text = String(value).trim().toLowerCase();
  const normalized = text.replace(/[^a-z0-9]+/g, ' ').trim();
  const compact = normalized.replace(/\s+/g, '_');

  if (['easy', 'beginner', 'simple', 'easier', 'light'].includes(compact)) return 'easy';
  if (['medium', 'normal', 'regular', 'standard', 'average', 'moderate'].includes(compact)) return 'medium';
  if (['hard', 'difficult', 'advanced', 'challenging', 'challenge', 'tough', 'harder'].includes(compact)) return 'hard';
  return null;
}

function findDifficultyValue(value, depth = 0) {
  if (!value || depth > 5) return null;
  if (typeof value === 'string') return normalizeDifficulty(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findDifficultyValue(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof value !== 'object') return null;

  for (const [key, child] of Object.entries(value)) {
    const keyText = key.toLowerCase();
    if ((keyText === 'difficulty' || keyText === 'difficulty_level') && typeof child === 'string') {
      const difficulty = normalizeDifficulty(child);
      if (difficulty) return difficulty;
    }
    const found = findDifficultyValue(child, depth + 1);
    if (found) return found;
  }
  return null;
}

async function handleToolCalls(message) {
  const metadata = extractMetadata(message);
  const toolCalls = message.toolCallList || (message.toolCall ? [message.toolCall] : []);
  const results = [];

  for (const toolCall of toolCalls) {
    const name = toolCall.function?.name || toolCall.name;
    const args = parseToolArguments(toolCall.function?.arguments || toolCall.arguments);
    logger.info({ type: message?.type, toolName: name, args }, 'Received Vapi tool call');

    if (name === 'startTrainingCall' || name === 'handoff_tool') {
      const scenario = metadata.selectedScenario || args.scenario || 'new_student';
      const difficulty = findDifficultyValue(args) || normalizeDifficulty(metadata.selectedDifficulty);
      if (!difficulty) {
        results.push({
          toolCallId: toolCall.id,
          result: 'Difficulty was unclear. Ask the caller to choose easy, medium, or hard, then call handoff_tool again.',
        });
        continue;
      }
      const dbCall = await ensureCallStarted(message, { scenario, difficulty });
      const scenarioConfig = await resolveScenarioForCall(scenario, dbCall?.schoolId ?? null);

      if (dbCall) {
        await updateCall(dbCall.id, { scenario, difficulty }).catch(() => {});
        logger.info({
          type: message?.type,
          callId: dbCall.id,
          vapiCallId: dbCall.vapiCallId,
          scenario,
          difficulty,
          toolName: name,
        }, 'Handled Vapi training tool call');
      }

      const systemPrompt = scenarioConfig?.custom
        ? buildCustomScenarioPrompt(scenarioConfig.custom, null, difficulty)
        : getScenarioSystemPrompt(scenario, null, difficulty, scenarioConfig?.systemPromptBase || null);
      results.push({
        toolCallId: toolCall.id,
        result: dbCall && scenarioConfig
          ? `Switch into the selected roleplay scenario now. Scenario: ${scenario}. Difficulty: ${difficulty}.\n\n${systemPrompt}`
          : dbCall
          ? `Unknown scenario "${scenario}". Please choose one of the available scenarios.`
          : 'Session not identified. Please reload the dashboard and try again.',
      });
      continue;
    }

    results.push({
      toolCallId: toolCall.id,
      result: 'Unknown tool.',
    });
  }

  return { results };
}

async function buildDestinationResponse(message) {
  const call = message.call;
  const vapiCallId = call?.id;
  const metadata = extractMetadata(message);
  const params = parseToolArguments(message.parameters || message.toolCall?.function?.arguments || {});
  const scenarioSlug = metadata.selectedScenario || params.scenario || 'new_student';
  const difficulty = findDifficultyValue(params) || normalizeDifficulty(metadata.selectedDifficulty);
  logger.info({
    type: message?.type,
    vapiCallId,
    params,
    scenario: scenarioSlug,
    difficulty,
    metadataSelectedScenario: metadata.selectedScenario || null,
  }, 'Received Vapi destination request');
  if (!difficulty) {
    return { error: 'Difficulty was unclear. Please ask the caller to choose easy, medium, or hard.' };
  }

  const tenant = await resolveTenant(message);
  if (!tenant?.userId) return { error: 'Session not identified' };

  const scenarioConfig = await resolveScenarioForCall(scenarioSlug, tenant.schoolId ?? null);
  if (!scenarioConfig) {
    logger.warn({ type: message?.type, vapiCallId, scenario: scenarioSlug }, 'Vapi handoff requested unknown scenario');
    return { error: `Unknown scenario "${scenarioSlug}"` };
  }

  const dbCall = await ensureCallStarted(message, { scenario: scenarioSlug, difficulty });
  if (dbCall) {
    await updateCall(dbCall.id, { scenario: scenarioSlug, difficulty }).catch(() => {});
  }

  const school = tenant.schoolId ? await findSchoolById(tenant.schoolId).catch(() => null) : null;
  const schoolSettings = school ? {
    schoolName: school.name,
    streetAddress: school.streetAddress,
    city: school.city,
    state: school.state,
    introOffer: school.introOffer,
    priceRangeLow: school.priceRangeLow,
    priceRangeHigh: school.priceRangeHigh,
    programDirectorName: school.programDirectorName,
  } : null;

  const systemPrompt = scenarioConfig.custom
    ? buildCustomScenarioPrompt(scenarioConfig.custom, schoolSettings, difficulty)
    : getScenarioSystemPrompt(scenarioSlug, schoolSettings, difficulty, scenarioConfig.systemPromptBase);
  const assistant = {
    model: { provider: 'openai', model: config.openaiModel, messages: [{ role: 'system', content: systemPrompt }] },
    voice: scenarioConfig.voice,
    firstMessage: scenarioConfig.firstMessage,
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 600,
    serverMessages: ['end-of-call-report', 'status-update'],
  };
  if (config.vapiWebhookUrl) assistant.server = { url: config.vapiWebhookUrl, timeoutSeconds: 20 };

  return {
    destination: {
      type: 'assistant',
      assistantName: scenarioConfig.title,
      description: `${scenarioConfig.title} (${difficulty})`,
      assistant,
    },
  };
}

async function handleEndOfCallReport(message) {
  const call = message.call;
  const artifact = message.artifact;
  const vapiCallId = call?.id;
  if (!vapiCallId) return {};

  const dbCall = await findCallByVapiId(vapiCallId).catch(() => null);
  if (!dbCall) {
    clearCtx(vapiCallId);
    logger.warn({ type: message?.type, vapiCallId }, 'End-of-call report had no matching scenario call row');
    return {};
  }

  const messages = artifact?.messages || [];
  const turns = [];
  const lines = [];
  for (const msg of messages) {
    if (msg.role === 'user' && msg.message) {
      turns.push({ role: 'staff', text: msg.message });
      lines.push(`Staff: ${msg.message}`);
    } else if (msg.role === 'bot' && msg.message) {
      turns.push({ role: 'prospect', text: msg.message });
      lines.push(`Prospect: ${msg.message}`);
    }
  }

  const transcript = lines.join('\n');
  const startedAt = message.startedAt ? new Date(message.startedAt) : null;
  const endedAt = message.endedAt ? new Date(message.endedAt) : null;
  const durationSeconds = startedAt && endedAt ? Math.round((endedAt - startedAt) / 1000) : null;

  await updateCall(dbCall.id, {
    status: 'completed',
    transcription: transcript,
    transcriptTurns: turns,
    durationSeconds,
    recordingUrl: artifact?.recordingUrl || null,
    costUsd: typeof message.cost === 'number' ? message.cost : null,
  });

  clearCtx(vapiCallId);
  if (isScoreableTranscriptTurns(turns)) {
    backgroundScore(dbCall.id, transcript, dbCall.scenario, dbCall.schoolId ?? null, dbCall.difficulty);
  } else {
    logger.info({
      callId: dbCall.id,
      vapiCallId,
      turnCount: turns.length,
      staffTurnCount: turns.filter((turn) => turn.role === 'staff').length,
      staffWordCount: countWords(turns.filter((turn) => turn.role === 'staff').map((turn) => turn.text).join(' ')),
    }, 'Skipped scoring because transcript did not contain enough real conversation');
  }
  return {};
}

async function backgroundScore(callId, transcript, scenario, schoolId = null, difficulty = null) {
  try {
    await updateCall(callId, { status: 'scoring' });
    let scenarioTitle = SCENARIOS[scenario]?.title || scenario;
    let customScoringPrompt = null;
    let scoringCategories = null;
    if (SCENARIOS[scenario]) {
      const builtIn = (await getPublishedBuiltInScenarios()).find((item) => item.slug === scenario);
      if (builtIn) {
        scenarioTitle = builtIn.title;
        scoringCategories = builtIn.scoringCategories;
      }
    }
    if (!SCENARIOS[scenario] && await schoolCanUseCustomScenarios(schoolId)) {
      const custom = await findCustomScenarioBySlug(scenario, schoolId).catch(() => null);
      if (custom) {
        scenarioTitle = custom.title;
        customScoringPrompt = custom.scoringPrompt;
      }
    }
    const result = await scoreCallTranscript(transcript, scenarioTitle, customScoringPrompt, difficulty, scoringCategories);
    await insertScorecard({
      callId,
      overallScore: result.overallScore,
      categories: result.categories,
      highlights: result.highlights,
      missedOpportunities: result.missedOpportunities,
      suggestions: result.suggestions,
      summary: result.summary,
      model: result._meta?.model,
    });
    await updateCall(callId, { status: 'scored' });
    logger.info({ callId, score: result.overallScore }, 'Call scored');
  } catch (err) {
    logger.error({ err, callId }, 'Scoring failed');
    await updateCall(callId, { status: 'completed' }).catch(() => {});
  }
}

export async function handleVapiWebhook(message) {
  if (!message) throw new Error('VALIDATION');

  logger.info({
    type: message.type,
    vapiCallId: message.call?.id ?? null,
    hasParameters: !!message.parameters,
    toolCount: message.toolCallList?.length ?? (message.toolCall ? 1 : 0),
  }, 'Received Vapi webhook event');

  if (message.type === 'assistant-request') {
    return handleAssistantRequest(message);
  }

  if (message.type === 'handoff-destination-request' || message.type === 'transfer-destination-request') {
    return buildDestinationResponse(message);
  }
  if (message.type === 'tool-calls') return handleToolCalls(message);
  if (message.type === 'status-update') {
    const metadata = extractMetadata(message);
    const scenario = metadata.selectedScenario || 'new_student';
    const difficulty = normalizeDifficulty(metadata.selectedDifficulty) || 'medium';
    await ensureCallStarted(message, { scenario, difficulty });
    return {};
  }
  if (message.type === 'end-of-call-report') return handleEndOfCallReport(message);
  return {};
}
