import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callsApi } from '../api/calls.api';
import { useAuthStore } from '../store/auth.store';

export const callKeys = {
  all: ['calls'],
  list: ({ params, userId, schoolId, viewingSchoolId }) => ['calls', 'list', params, userId, schoolId, viewingSchoolId],
  detail: (id) => ['calls', 'detail', id],
  recording: (id) => ['calls', 'recording', id],
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

export function useCallRecording(id, enabled = true) {
  return useQuery({
    queryKey: callKeys.recording(id),
    queryFn: () => callsApi.recording(id).then(r => r.data),
    enabled: !!id && enabled,
    gcTime: 0,
  });
}

export function useStartCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => callsApi.start(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: callKeys.all }),
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
