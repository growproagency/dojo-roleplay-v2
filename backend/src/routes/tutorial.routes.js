import { Router } from 'express';
import { validateBody, validateQuery } from '../middleware/validate.middleware.js';
import { tutorialProgressQuerySchema, tutorialProgressSchema } from '../schemas/tutorial.schema.js';
import * as tutorialController from '../controllers/tutorial.controller.js';

const router = Router();

router.get('/:tutorialKey/progress', validateQuery(tutorialProgressQuerySchema), tutorialController.getProgress);
router.put('/:tutorialKey/progress', validateBody(tutorialProgressSchema), tutorialController.saveProgress);

export default router;
