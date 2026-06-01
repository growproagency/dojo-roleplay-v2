import { asyncHandler } from '../utils/asyncHandler.js';
import { effectiveSchoolId } from '../middleware/auth.middleware.js';
import { listCalls, getCall, triggerScoring } from '../services/calls.service.js';

export const listCallsHandler = asyncHandler(async (req, res) => {
  const data = await listCalls({
    user: req.user,
    schoolId: effectiveSchoolId(req),
    scope: req.query.scope === 'mine' ? 'mine' : 'school',
    userId: req.query.userId ? parseInt(req.query.userId, 10) : null,
  });
  res.json({ data });
});

export const getCallHandler = asyncHandler(async (req, res) => {
  const callId = parseInt(req.params.id, 10);
  if (isNaN(callId)) throw Object.assign(new Error('VALIDATION'), { message: 'Invalid call ID' });
  const data = await getCall(callId, req.user);
  res.json({ data });
});

export const scoreCallHandler = asyncHandler(async (req, res) => {
  const callId = parseInt(req.params.id, 10);
  if (isNaN(callId)) throw Object.assign(new Error('VALIDATION'), { message: 'Invalid call ID' });
  const data = await triggerScoring(callId, req.user);
  res.json({ data });
});
