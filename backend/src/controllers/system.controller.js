import { asyncHandler } from '../utils/asyncHandler.js';
import { findPlatformSettings } from '../db/platform.queries.js';

export const getSystemStatusHandler = asyncHandler(async (_req, res) => {
  const settings = await findPlatformSettings().catch(() => null);
  res.json({
    data: {
      maintenance: {
        enabled: Boolean(settings?.maintenanceEnabled),
        message: settings?.maintenanceMessage ?? null,
        severity: settings?.maintenanceSeverity ?? 'info',
      },
    },
  });
});
