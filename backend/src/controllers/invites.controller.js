import { asyncHandler } from '../utils/asyncHandler.js';
import { getInvitePreview, acceptInviteToken } from '../services/invites.service.js';

export const getInviteHandler = asyncHandler(async (req, res) => {
  const data = await getInvitePreview(req.params.token);
  res.json({ data });
});

export const acceptInviteHandler = asyncHandler(async (req, res) => {
  const data = await acceptInviteToken(req.params.token, { user: req.user });
  res.json({ data });
});
