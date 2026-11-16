import { Router } from 'express';
import { listLeaderboardHandler } from '../controllers/leaderboard.controller.js';
import { validateQuery } from '../middleware/validate.middleware.js';
import { leaderboardQuerySchema } from '../schemas/leaderboard.schema.js';

const router = Router();
router.get('/', validateQuery(leaderboardQuerySchema), listLeaderboardHandler);
export default router;
