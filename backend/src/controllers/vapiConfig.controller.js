import { asyncHandler } from '../utils/asyncHandler.js';
import { createSessionToken } from '../utils/sessionToken.js';
import { findSchoolById, getSchoolUsageTotals } from '../db/schools.queries.js';
import { assertSchoolMonthlyMinutesAvailable } from '../services/usageLimits.service.js';
import { buildScenarioWebAssistant } from '../services/vapi.service.js';
import { assertSchoolAccess } from '../utils/schoolAccess.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const getVapiConfigHandler = asyncHandler(async (_req, res) => {
  const configured = !!(config.vapiPublicKey && config.vapiAssistantId);
  res.json({
    data: {
      publicKey:   config.vapiPublicKey || null,
      assistantId: config.vapiAssistantId || null,
      webhookUrl:  config.vapiWebhookUrl || null,
      configured,
    },
  });
});

export const getSessionTokenHandler = asyncHandler(async (req, res) => {
  const { user } = req;
  const schoolId = user.schoolId;

  if (schoolId) {
    const [school, usage] = await Promise.all([
      findSchoolById(schoolId),
      getSchoolUsageTotals(schoolId),
    ]);
    assertSchoolAccess(school);
    if (school?.usageCapUsd != null && usage.totalUsd >= school.usageCapUsd) {
      return res.status(402).json({ error: { code: 'USAGE_CAP', message: 'Usage cap reached' } });
    }
    await assertSchoolMonthlyMinutesAvailable(schoolId);
  }

  const token = createSessionToken({ userId: user.id, schoolId: schoolId ?? null });
  logger.info({ userId: user.id, schoolId: schoolId ?? null }, 'Issued Vapi session token');
  res.json({ data: { token } });
});

export const getScenarioAssistantHandler = asyncHandler(async (req, res) => {
  if (req.user.schoolId) {
    const school = await findSchoolById(req.user.schoolId);
    assertSchoolAccess(school);
  }
  const assistant = await buildScenarioWebAssistant({
    user: req.user,
    scenario: req.query.scenario,
    difficulty: req.query.difficulty,
  });
  res.json({ data: { assistant } });
});
