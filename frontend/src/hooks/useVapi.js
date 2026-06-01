import { useQuery } from '@tanstack/react-query';
import { vapiApi } from '../api/vapi.api';

export const vapiKeys = {
  config: ['vapi', 'config'],
};

export function useVapiConfig(enabled) {
  return useQuery({
    queryKey: vapiKeys.config,
    queryFn: () => vapiApi.getConfig().then((r) => r.data),
    enabled,
  });
}

export function useVapiSessionToken() {
  return async () => {
    const response = await vapiApi.getSessionToken();
    return response.data?.token ?? null;
  };
}

export function useVapiScenarioAssistant() {
  return async ({ scenario, difficulty }) => {
    const response = await vapiApi.getScenarioAssistant(scenario, difficulty);
    return response.data?.assistant ?? null;
  };
}
