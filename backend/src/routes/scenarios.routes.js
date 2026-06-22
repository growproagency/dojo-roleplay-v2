import { Router } from 'express';
import { validateBody } from '../middleware/validate.middleware.js';
import { requireGlobalAdmin, requireSchoolAdmin } from '../middleware/auth.middleware.js';
import { listScenariosHandler, listBuiltInHandler, updateBuiltInHandler, publishBuiltInHandler, resetBuiltInHandler, listAllCustomHandler, listManagedCustomHandler, createScenarioHandler, updateScenarioHandler, deleteScenarioHandler } from '../controllers/scenarios.controller.js';
import { createScenarioSchema, updateScenarioSchema, updateBuiltInScenarioSchema } from '../schemas/scenarios.schema.js';

const router = Router();

router.get('/', listScenariosHandler);
router.get('/built-in', requireGlobalAdmin, listBuiltInHandler);
router.put('/built-in/:slug', requireGlobalAdmin, validateBody(updateBuiltInScenarioSchema), updateBuiltInHandler);
router.post('/built-in/:slug/publish', requireGlobalAdmin, publishBuiltInHandler);
router.post('/built-in/:slug/reset', requireGlobalAdmin, resetBuiltInHandler);
router.get('/custom/all', requireGlobalAdmin, listAllCustomHandler);
router.get('/custom', requireSchoolAdmin, listManagedCustomHandler);
router.post('/custom', requireSchoolAdmin, validateBody(createScenarioSchema), createScenarioHandler);
router.put('/custom/:id', requireSchoolAdmin, validateBody(updateScenarioSchema), updateScenarioHandler);
router.delete('/custom/:id', requireSchoolAdmin, deleteScenarioHandler);

export default router;
