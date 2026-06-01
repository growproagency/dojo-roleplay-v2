import { Router } from 'express';
import { getVapiConfigHandler, getSessionTokenHandler, getScenarioAssistantHandler } from '../controllers/vapiConfig.controller.js';

const router = Router();

router.get('/', getVapiConfigHandler);
router.get('/session-token', getSessionTokenHandler);
router.get('/scenario-assistant', getScenarioAssistantHandler);

export default router;
