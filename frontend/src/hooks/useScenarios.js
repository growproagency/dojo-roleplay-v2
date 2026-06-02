import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scenariosApi } from '../api/scenarios.api';
import { useAuthStore } from '../store/auth.store';

export const scenarioKeys = {
  all: ['scenarios'],
  list: ['scenarios', 'list'],
  custom: ['scenarios', 'custom'],
};

export function useScenarios() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const schoolId = useAuthStore((s) => s.profile?.schoolId ?? s.profile?.school?.id ?? null);
  return useQuery({
    queryKey: [...scenarioKeys.list, userId, schoolId],
    queryFn: async () => {
      const r = await scenariosApi.list();
      const { builtIn = [], custom = [] } = r.data ?? {};
      return [...builtIn, ...custom];
    },
    enabled: !!userId,
  });
}

export function useAllCustomScenarios(enabled = true) {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const schoolId = useAuthStore((s) => s.profile?.schoolId ?? s.profile?.school?.id ?? null);
  return useQuery({
    queryKey: [...scenarioKeys.custom, userId, schoolId],
    queryFn: () => scenariosApi.listManagedCustom().then(r => r.data),
    enabled: enabled && !!userId,
  });
}

export function useCreateCustomScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => scenariosApi.createCustom(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: scenarioKeys.all }),
  });
}

export function useUpdateCustomScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => scenariosApi.updateCustom(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: scenarioKeys.all }),
  });
}

export function useToggleCustomScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }) => scenariosApi.updateCustom(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: scenarioKeys.all }),
  });
}

export function useDeleteCustomScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => scenariosApi.deleteCustom(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: scenarioKeys.all }),
  });
}
