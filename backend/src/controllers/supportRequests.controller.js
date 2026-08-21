import { asyncHandler } from '../utils/asyncHandler.js';
import * as supportRequestsService from '../services/supportRequests.service.js';

export const listMine = asyncHandler(async (req, res) => {
  const data = await supportRequestsService.listMine(req.user.id);
  res.json({ data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await supportRequestsService.create(req.user, req.body);
  res.status(201).json({ data });
});
