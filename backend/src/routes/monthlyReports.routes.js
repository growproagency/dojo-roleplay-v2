import { Router } from 'express';
import { requireSchoolAdmin } from '../middleware/auth.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware.js';
import { reportParamsSchema, reportQuerySchema, reportTimezoneSchema } from '../schemas/monthlyReports.schema.js';
import { getMonthlyReport, listMonthlyReports, updateReportSettings } from '../controllers/monthlyReports.controller.js';

const router = Router();
// Authentication is applied to /api in server.js before this router.
router.use(requireSchoolAdmin);
router.get('/', validateQuery(reportQuerySchema), listMonthlyReports);
router.put('/settings', validateBody(reportTimezoneSchema), updateReportSettings);
router.get('/:userId', validateParams(reportParamsSchema), validateQuery(reportQuerySchema), getMonthlyReport);
export default router;
