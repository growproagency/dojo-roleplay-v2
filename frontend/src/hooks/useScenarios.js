import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scenariosApi } from '../api/scenarios.api';

export const scenarioKeys = {
  all: ['scenarios'],
  list: ['scenarios', 'list'],
  custom: ['scenarios', 'custom'],
};

export function useScenarios() {
  return useQuery({
    queryKey: scenarioKeys.list,
    queryFn: async () => {
      const r = await scenariosApi.list();
      const { builtIn = [], custom = [] } = r.data ?? {};
      return [...builtIn, ...custom];
    },
  });
}

export function useAllCustomScenarios() {
  return useQuery({
    queryKey: scenarioKeys.custom,
    queryFn: () => scenariosApi.listManagedCustom().then(r => r.data),
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
