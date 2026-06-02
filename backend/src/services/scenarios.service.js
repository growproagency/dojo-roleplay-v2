import { findCustomScenarios, findManagedCustomScenarios, findAllCustomScenarios, findCustomScenarioById, insertCustomScenario, updateCustomScenario, deleteCustomScenario } from '../db/scenarios.queries.js';
import { findSchoolById } from '../db/schools.queries.js';
import { SCENARIOS, BUILT_IN_SCENARIO_IDS } from '../data/scenarios.js';
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

export async function listScenarios(req) {
  const schoolId = effectiveSchoolId(req);
  const customScenarios = (await hasCustomScenarioAccess(schoolId))
    ? await findCustomScenarios(schoolId)
    : [];
  const builtIn = Object.values(SCENARIOS).map(s => ({
    ...s,
    isBuiltIn: true,
    isActive: true,
  }));
  return {
    builtIn,
    custom: customScenarios.map(s => ({ ...s, isBuiltIn: false })),
  };
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
