import { asyncHandler } from '../utils/asyncHandler.js';
import { effectiveSchoolId } from '../middleware/auth.middleware.js';
import { getLeaderboard } from '../services/leaderboard.service.js';

export const listLeaderboardHandler = asyncHandler(async (req, res) => {
  const data = await getLeaderboard({
    schoolId: effectiveSchoolId(req),
    scenario: req.query.scenario || null,
    fromDate: req.query.from || null,
    isGlobalAdmin: req.user?.role === 'global_admin' || req.user?.role === 'admin',
  });
  res.json({ data });
});
