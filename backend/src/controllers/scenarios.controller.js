import { asyncHandler } from '../utils/asyncHandler.js';
import { listScenarios, listBuiltInScenariosForAdmin, updateBuiltInScenario, publishBuiltInScenario, resetBuiltInScenario, listManagedCustomScenarios, listAllCustomScenarios, createCustomScenario, editCustomScenario, removeCustomScenario } from '../services/scenarios.service.js';

export const listScenariosHandler = asyncHandler(async (req, res) => {
  const data = await listScenarios(req);
  res.json({ data });
});

export const listAllCustomHandler = asyncHandler(async (req, res) => {
  const data = await listAllCustomScenarios();
  res.json({ data });
});

export const listBuiltInHandler = asyncHandler(async (_req, res) => {
  const data = await listBuiltInScenariosForAdmin();
  res.json({ data });
});

export const updateBuiltInHandler = asyncHandler(async (req, res) => {
  const data = await updateBuiltInScenario(req.params.slug, req, req.body);
  res.json({ data });
});

export const publishBuiltInHandler = asyncHandler(async (req, res) => {
  const data = await publishBuiltInScenario(req.params.slug, req);
  res.json({ data });
});

export const resetBuiltInHandler = asyncHandler(async (req, res) => {
  const data = await resetBuiltInScenario(req.params.slug, req);
  res.json({ data });
});

export const listManagedCustomHandler = asyncHandler(async (req, res) => {
  const data = await listManagedCustomScenarios(req);
  res.json({ data });
});

export const createScenarioHandler = asyncHandler(async (req, res) => {
  const data = await createCustomScenario(req, req.body);
  res.status(201).json({ data });
});

export const updateScenarioHandler = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw Object.assign(new Error('VALIDATION'), { message: 'Invalid scenario ID' });
  const data = await editCustomScenario(id, req, req.body);
  res.json({ data });
});

export const deleteScenarioHandler = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) throw Object.assign(new Error('VALIDATION'), { message: 'Invalid scenario ID' });
  await removeCustomScenario(id, req);
  res.json({ data: { success: true } });
});
