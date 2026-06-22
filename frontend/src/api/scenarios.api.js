import { apiClient } from './client';

export const scenariosApi = {
  list:        ()      => apiClient.get('/api/scenarios'),
  listBuiltIn: ()      => apiClient.get('/api/scenarios/built-in'),
  updateBuiltIn: (slug, data) => apiClient.put(`/api/scenarios/built-in/${encodeURIComponent(slug)}`, data),
  publishBuiltIn: (slug) => apiClient.post(`/api/scenarios/built-in/${encodeURIComponent(slug)}/publish`, {}),
  resetBuiltIn: (slug) => apiClient.post(`/api/scenarios/built-in/${encodeURIComponent(slug)}/reset`, {}),
  listManagedCustom: () => apiClient.get('/api/scenarios/custom'),
  listAllCustom: ()    => apiClient.get('/api/scenarios/custom/all'),
  createCustom: (data) => apiClient.post('/api/scenarios/custom', data),
  updateCustom: (id, data) => apiClient.put(`/api/scenarios/custom/${id}`, data),
  deleteCustom: (id)   => apiClient.delete(`/api/scenarios/custom/${id}`),
};
