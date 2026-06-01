import { asyncHandler } from '../utils/asyncHandler.js';
import { getInvitePreview, acceptInviteToken } from '../services/invites.service.js';

export const getInviteHandler = asyncHandler(async (req, res) => {
  const data = await getInvitePreview(req.params.token);
  res.json({ data });
});

export const acceptInviteHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const data = await acceptInviteToken(req.params.token, { email, password });
  res.json({ data });
});
