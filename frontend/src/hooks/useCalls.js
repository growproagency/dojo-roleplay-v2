import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callsApi } from '../api/calls.api';

export const callKeys = {
  all: ['calls'],
  list: (params) => ['calls', 'list', params],
  detail: (id) => ['calls', 'detail', id],
};

export function useCalls(params = {}) {
  return useQuery({
    queryKey: callKeys.list(params),
    queryFn: () => callsApi.list(params).then(r => r.data),
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
