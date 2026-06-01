// routes/example.routes.js
// URL definitions only — no logic.
// Maps HTTP method + URL to middleware + controller.
// Replace "example" with your resource name.
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createExampleSchema, updateExampleSchema } from '../schemas/example.schema.js';
import * as exampleController from '../controllers/example.controller.js';

const router = Router();

// All routes below require a valid Supabase session token
router.get('/',     authMiddleware, exampleController.getAll);
router.get('/:id',  authMiddleware, exampleController.getById);
router.post('/',    authMiddleware, validateBody(createExampleSchema), exampleController.create);
router.patch('/:id',authMiddleware, validateBody(updateExampleSchema), exampleController.update);
router.delete('/:id',authMiddleware, exampleController.remove);

export default router;
