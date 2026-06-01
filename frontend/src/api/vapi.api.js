import { apiClient } from './client';

export const vapiApi = {
  getConfig:            () => apiClient.get('/api/vapi-config'),
  getSessionToken:      () => apiClient.get('/api/vapi-config/session-token'),
  getScenarioAssistant: (scenario, difficulty) => apiClient.get(`/api/vapi-config/scenario-assistant?scenario=${encodeURIComponent(scenario)}&difficulty=${encodeURIComponent(difficulty)}`),
};
