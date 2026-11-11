import { asyncHandler } from '../utils/asyncHandler.js';
import { effectiveSchoolId } from '../middleware/auth.middleware.js';
import { monthlyReportsService } from '../services/monthlyReports.service.js';

export const listMonthlyReports = asyncHandler(async (req, res) => {
  const result = await monthlyReportsService.list({ actor: req.user, schoolId: effectiveSchoolId(req), ...req.query });
  res.json(result);
});

export const getMonthlyReport = asyncHandler(async (req, res) => {
  const result = await monthlyReportsService.detail({ actor: req.user, schoolId: effectiveSchoolId(req),
    month: req.query.month, userId: Number(req.params.userId) });
  res.json(result);
});

export const updateReportSettings = asyncHandler(async (req, res) => {
  const result = await monthlyReportsService.updateSettings({ actor: req.user, schoolId: effectiveSchoolId(req), timezone: req.body.timezone });
  res.json(result);
});
