import { asyncHandler } from '../utils/asyncHandler.js';
import { effectiveSchoolId } from '../middleware/auth.middleware.js';
import { getLeaderboard } from '../services/leaderboard.service.js';

export const listLeaderboardHandler = asyncHandler(async (req, res) => {
  const result = await getLeaderboard({
    schoolId: effectiveSchoolId(req),
    filters: req.query,
    userId: req.user.id,
    isGlobalAdmin: req.user?.role === 'global_admin' || req.user?.role === 'admin',
  });
  res.json(result);
});
