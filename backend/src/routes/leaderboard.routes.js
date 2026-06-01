import { Router } from 'express';
import { listLeaderboardHandler } from '../controllers/leaderboard.controller.js';

const router = Router();
router.get('/', listLeaderboardHandler);
export default router;
