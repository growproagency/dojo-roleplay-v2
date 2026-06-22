import { findBuiltInScenarios, findCustomScenarios, findManagedCustomScenarios, findAllCustomScenarios, findCustomScenarioById, insertCustomScenario, updateCustomScenario, deleteCustomScenario, upsertBuiltInScenario } from '../db/scenarios.queries.js';
import { findSchoolById } from '../db/schools.queries.js';
import { BUILT_IN_SCENARIO_IDS, BUILT_IN_SCENARIO_DEFAULTS, getBuiltInScenarioDefault } from '../data/scenarios.js';
import { effectiveSchoolId } from '../middleware/auth.middleware.js';
import { canUseCustomScenarios } from '../utils/plans.js';

function isGlobalAdmin(user) {
  return user?.role === 'global_admin' || user?.role === 'admin';
}

function scopedScenarioSchoolId(req, requestedSchoolId) {
  if (isGlobalAdmin(req.user)) return requestedSchoolId ?? null;
  if (!req.user?.schoolId) throw new Error('FORBIDDEN');
  return req.user.schoolId;
}

function canManageScenario(req, scenario) {
  if (isGlobalAdmin(req.user)) return true;
  return scenario.schoolId != null && scenario.schoolId === req.user?.schoolId;
}

async function assertCustomScenariosAllowedForSchool(schoolId) {
  if (!schoolId) return;
  const school = await findSchoolById(schoolId);
  if (!canUseCustomScenarios(school)) throw new Error('CUSTOM_SCENARIOS_PLAN_REQUIRED');
}

async function hasCustomScenarioAccess(schoolId) {
  if (!schoolId) return false;
  const school = await findSchoolById(schoolId);
  return canUseCustomScenarios(school);
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100);
}

function mergeBuiltInDefault(row) {
  const defaults = getBuiltInScenarioDefault(row.slug);
  if (!defaults) return null;
  return {
    ...defaults,
    ...row,
    systemPromptBase: row.systemPromptBase || defaults.systemPromptBase,
    firstMessage: row.firstMessage ?? defaults.firstMessage,
    voiceProvider: row.voiceProvider || defaults.voiceProvider,
    voiceId: row.voiceId || defaults.voiceId,
    scoringRubricType: row.scoringRubricType || defaults.scoringRubricType,
    scoringCategories: row.scoringCategories || defaults.scoringCategories,
    objectionFocus: row.objectionFocus || defaults.objectionFocus,
    objectionCounts: row.objectionCounts || defaults.objectionCounts,
  };
}

async function findBuiltInRowsSafe() {
  return findBuiltInScenarios().catch(() => []);
}

export async function getPublishedBuiltInScenarios() {
  const rows = await findBuiltInRowsSafe();
  const rowBySlug = new Map(rows.map((row) => [row.slug, row]));
  return Object.values(BUILT_IN_SCENARIO_DEFAULTS).map((defaults) => {
    const row = rowBySlug.get(defaults.slug);
    const merged = row?.status === 'published' ? mergeBuiltInDefault(row) : defaults;
    return {
      id: merged.slug,
      slug: merged.slug,
      title: merged.title,
      description: merged.description,
      systemPrompt: merged.systemPromptBase,
      systemPromptBase: merged.systemPromptBase,
      firstMessage: merged.firstMessage,
      voiceProvider: merged.voiceProvider,
      voiceId: merged.voiceId,
      scoringRubricType: merged.scoringRubricType,
      scoringCategories: merged.scoringCategories,
      objectionFocus: merged.objectionFocus,
      objectionCounts: merged.objectionCounts,
      status: 'published',
      isBuiltIn: true,
      isActive: true,
    };
  });
}

export async function listBuiltInScenariosForAdmin() {
  const rows = await findBuiltInRowsSafe();
  const rowBySlug = new Map(rows.map((row) => [row.slug, row]));
  return Object.values(BUILT_IN_SCENARIO_DEFAULTS).map((defaults) => {
    const row = rowBySlug.get(defaults.slug);
    const merged = row ? mergeBuiltInDefault(row) : defaults;
    return {
      ...merged,
      id: merged.slug,
      isBuiltIn: true,
      hasDatabaseOverride: !!row,
      updatedBy: row?.updatedBy ?? null,
      createdAt: row?.createdAt ?? null,
      updatedAt: row?.updatedAt ?? null,
    };
  });
}

export async function listScenarios(req) {
  const schoolId = effectiveSchoolId(req);
  const customScenarios = (await hasCustomScenarioAccess(schoolId))
    ? await findCustomScenarios(schoolId)
    : [];
  const builtIn = await getPublishedBuiltInScenarios();
  return {
    builtIn,
    custom: customScenarios.map(s => ({ ...s, isBuiltIn: false })),
  };
}

export async function updateBuiltInScenario(slug, req, data) {
  const defaults = getBuiltInScenarioDefault(slug);
  if (!defaults) throw new Error('NOT_FOUND');
  const scoringCategories = data.scoringCategories ?? defaults.scoringCategories;
  const totalWeight = Array.isArray(scoringCategories)
    ? scoringCategories.reduce((sum, category) => sum + Number(category?.weight || 0), 0)
    : 0;
  if (Math.round(totalWeight * 100) / 100 !== 100) throw new Error('VALIDATION');
  return upsertBuiltInScenario({
    slug,
    title: data.title ?? defaults.title,
    description: data.description ?? defaults.description,
    systemPromptBase: data.systemPromptBase ?? defaults.systemPromptBase,
    firstMessage: data.firstMessage ?? defaults.firstMessage,
    voiceId: data.voiceId ?? defaults.voiceId,
    voiceProvider: data.voiceProvider ?? defaults.voiceProvider,
    scoringRubricType: data.scoringRubricType ?? defaults.scoringRubricType,
    scoringCategories,
    objectionFocus: data.objectionFocus ?? defaults.objectionFocus,
    objectionCounts: data.objectionCounts ?? defaults.objectionCounts,
    status: data.status ?? 'draft',
    updatedBy: req.user.id,
  });
}

export async function publishBuiltInScenario(slug, req) {
  const rows = await findBuiltInRowsSafe();
  const existing = rows.find((row) => row.slug === slug);
  const source = existing ? mergeBuiltInDefault(existing) : getBuiltInScenarioDefault(slug);
  if (!source) throw new Error('NOT_FOUND');
  return upsertBuiltInScenario({ ...source, status: 'published', updatedBy: req.user.id });
}

export async function resetBuiltInScenario(slug, req) {
  const defaults = getBuiltInScenarioDefault(slug);
  if (!defaults) throw new Error('NOT_FOUND');
  return upsertBuiltInScenario({ ...defaults, status: 'published', updatedBy: req.user.id });
}

export async function listAllCustomScenarios() {
  return findAllCustomScenarios();
}

export async function listManagedCustomScenarios(req) {
  if (!isGlobalAdmin(req.user) && !req.user?.schoolId) throw new Error('FORBIDDEN');
  if (!isGlobalAdmin(req.user)) await assertCustomScenariosAllowedForSchool(req.user.schoolId);
  return findManagedCustomScenarios(req.user?.schoolId ?? null, isGlobalAdmin(req.user));
}

export async function createCustomScenario(req, data) {
  const slug = data.slug || slugify(data.title);
  if (!slug) throw new Error('VALIDATION');
  if (BUILT_IN_SCENARIO_IDS.includes(slug)) throw new Error('CONFLICT');
  const schoolId = scopedScenarioSchoolId(req, data.schoolId);
  await assertCustomScenariosAllowedForSchool(schoolId);
  return insertCustomScenario({ ...data, slug, schoolId, createdBy: req.user.id });
}

export async function editCustomScenario(id, req, data) {
  const existing = await findCustomScenarioById(id);
  if (!existing) throw new Error('NOT_FOUND');
  if (!canManageScenario(req, existing)) throw new Error('FORBIDDEN');
  const next = { ...data };
  if (data.schoolId !== undefined) {
    next.schoolId = scopedScenarioSchoolId(req, data.schoolId);
  }
  await assertCustomScenariosAllowedForSchool(next.schoolId ?? existing.schoolId);
  await updateCustomScenario(id, next);
  return findCustomScenarioById(id);
}

export async function removeCustomScenario(id, req) {
  const existing = await findCustomScenarioById(id);
  if (!existing) throw new Error('NOT_FOUND');
  if (!canManageScenario(req, existing)) throw new Error('FORBIDDEN');
  if (!isGlobalAdmin(req.user)) await assertCustomScenariosAllowedForSchool(existing.schoolId);
  await deleteCustomScenario(id);
}
