import { Router } from 'express';
import { listCallsHandler, getCallHandler, scoreCallHandler } from '../controllers/calls.controller.js';

const router = Router();

router.get('/', listCallsHandler);
router.get('/:id', getCallHandler);
router.post('/:id/score', scoreCallHandler);

export default router;
