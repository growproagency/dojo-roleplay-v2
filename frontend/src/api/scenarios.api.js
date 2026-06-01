import { apiClient } from './client';

export const scenariosApi = {
  list:        ()      => apiClient.get('/api/scenarios'),
  listManagedCustom: () => apiClient.get('/api/scenarios/custom'),
  listAllCustom: ()    => apiClient.get('/api/scenarios/custom/all'),
  createCustom: (data) => apiClient.post('/api/scenarios/custom', data),
  updateCustom: (id, data) => apiClient.put(`/api/scenarios/custom/${id}`, data),
  deleteCustom: (id)   => apiClient.delete(`/api/scenarios/custom/${id}`),
};
