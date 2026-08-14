import { Router } from 'express';
import { validateBody } from '../middleware/validate.middleware.js';
import { startCallSchema } from '../schemas/calls.schema.js';
import { listCallsHandler, getCallHandler, getCallRecordingHandler, startCallHandler, scoreCallHandler } from '../controllers/calls.controller.js';

const router = Router();

router.get('/', listCallsHandler);
router.post('/start', validateBody(startCallSchema), startCallHandler);
router.get('/:id/recording', getCallRecordingHandler);
router.get('/:id', getCallHandler);
router.post('/:id/score', scoreCallHandler);

export default router;
