import { Router } from 'express';
import { getSystemStatusHandler } from '../controllers/system.controller.js';

const router = Router();
router.get('/status', getSystemStatusHandler);
export default router;
