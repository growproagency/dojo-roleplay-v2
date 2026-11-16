import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { monthlyReportsApi } from '../api/monthlyReports.api';
import { useAuthStore } from '../store/auth.store';
import { useUIStore } from '../store/ui.store';

export const monthlyReportKeys = {
  all: ['monthly-reports'],
  list: (scope, params) => ['monthly-reports', scope, 'list', params],
  detail: (scope, userId, month) => ['monthly-reports', scope, 'detail', userId, month],
};

function useReportScope() {
  const userId = useAuthStore(s => s.user?.id);
  const role = useAuthStore(s => s.profile?.role);
  const schoolId = useAuthStore(s => s.profile?.schoolId ?? s.profile?.school?.id);
  const viewingSchoolId = useUIStore(s => s.viewingSchoolId);
  const effectiveSchoolId = viewingSchoolId ?? schoolId;
  return { key: [userId, effectiveSchoolId, role], schoolId: effectiveSchoolId,
    enabled: !!userId && !!effectiveSchoolId && ['school_admin', 'global_admin', 'admin'].includes(role) };
}

export function useMonthlyReports(params, enabled = true) {
  const scope = useReportScope();
  return useQuery({ queryKey: monthlyReportKeys.list(scope.key, params),
    queryFn: () => monthlyReportsApi.list(params), enabled: scope.enabled && enabled });
}

export function useMonthlyReport(userId, params) {
  const scope = useReportScope();
  return useQuery({ queryKey: monthlyReportKeys.detail(scope.key, userId, params.month),
    queryFn: () => monthlyReportsApi.detail(userId, params).then(result => result.data),
    enabled: scope.enabled && !!userId });
}

export function useUpdateReportSettings() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: monthlyReportsApi.updateSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: monthlyReportKeys.all }) });
}

export function useDownloadMonthlyReport() {
  return useMutation({ mutationFn: async report => {
    const [{ downloadMonthlyReport }, font] = await Promise.all([
      import('../utils/downloadMonthlyReport'), monthlyReportsApi.loadFont(),
    ]);
    downloadMonthlyReport(report, font);
  } });
}
