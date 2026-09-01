import { apiClient } from './client';

export const supportRequestsApi = {
  listMine: () => apiClient.get('/api/support-requests'),
  create: (data) => apiClient.post('/api/support-requests', data),
};
