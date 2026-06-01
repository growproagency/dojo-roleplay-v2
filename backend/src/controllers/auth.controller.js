import { asyncHandler } from '../utils/asyncHandler.js';
import { getMe, updateProfile } from '../services/auth.service.js';

export const getMeHandler = asyncHandler(async (req, res) => {
  const data = await getMe(req.user.id);
  res.json({ data });
});

export const updateMeHandler = asyncHandler(async (req, res) => {
  const data = await updateProfile(req.user.id, req.body);
  res.json({ data });
});

export const logoutHandler = asyncHandler(async (_req, res) => {
  res.json({ data: { success: true } });
});
