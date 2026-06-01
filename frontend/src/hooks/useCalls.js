import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callsApi } from '../api/calls.api';
import { useAuthStore } from '../store/auth.store';

export const callKeys = {
  all: ['calls'],
  list: ({ params, userId, schoolId, viewingSchoolId }) => ['calls', 'list', params, userId, schoolId, viewingSchoolId],
  detail: (id) => ['calls', 'detail', id],
};

export function useCalls(params = {}) {
  const userId = useAuthStore(s => s.user?.id ?? null);
  const schoolId = useAuthStore(s => s.profile?.schoolId ?? null);
  const viewingSchoolId = useAuthStore(s => s.profile?._viewingSchoolId ?? null);

  return useQuery({
    queryKey: callKeys.list({ params, userId, schoolId, viewingSchoolId }),
    queryFn: () => callsApi.list(params).then(r => r.data),
    enabled: !!userId,
  });
}

export function useCall(id) {
  return useQuery({
    queryKey: callKeys.detail(id),
    queryFn: () => callsApi.get(id).then(r => r.data),
    enabled: !!id,
  });
}

export function useScoreCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => callsApi.score(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: callKeys.detail(id) });
      qc.invalidateQueries({ queryKey: callKeys.all });
    },
  });
}
