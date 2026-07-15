import { Router } from 'express';
import { listCallsHandler, getCallHandler, getCallRecordingHandler, scoreCallHandler } from '../controllers/calls.controller.js';

const router = Router();

router.get('/', listCallsHandler);
router.get('/:id/recording', getCallRecordingHandler);
router.get('/:id', getCallHandler);
router.post('/:id/score', scoreCallHandler);

export default router;
