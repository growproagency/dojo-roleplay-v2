import { apiClient } from './client';

export const systemApi = {
  getStatus: () => apiClient.get('/api/system/status'),
};
