import { asyncHandler } from '../utils/asyncHandler.js';
import * as tutorialService from '../services/tutorial.service.js';

export const getProgress = asyncHandler(async (req, res) => {
  const data = await tutorialService.getProgress(req.user.id, req.params.tutorialKey, req.query.version);
  res.json({ data });
});

export const saveProgress = asyncHandler(async (req, res) => {
  const { tutorialVersion, ...progress } = req.body;
  const data = await tutorialService.saveProgress(req.user.id, req.params.tutorialKey, tutorialVersion, progress);
  res.json({ data });
});
