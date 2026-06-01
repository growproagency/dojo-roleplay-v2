import { apiClient } from './client';
import { useAuthStore } from '../store/auth.store';

function viewingHeaders() {
  const profile = useAuthStore.getState().profile;
  const viewingSchoolId = profile?._viewingSchoolId;
  return viewingSchoolId ? { 'x-viewing-school-id': String(viewingSchoolId) } : {};
}

export const callsApi = {
  list:        (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiClient.get(`/api/calls${qs ? `?${qs}` : ''}`, { headers: viewingHeaders() });
  },
  get:         (id)          => apiClient.get(`/api/calls/${id}`, { headers: viewingHeaders() }),
  score:       (id)          => apiClient.post(`/api/calls/${id}/score`, {}, { headers: viewingHeaders() }),
};
