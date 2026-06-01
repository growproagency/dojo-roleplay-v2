import { apiClient } from './client';
import { useAuthStore } from '../store/auth.store';

function viewingHeaders() {
  const profile = useAuthStore.getState().profile;
  const viewingSchoolId = profile?._viewingSchoolId;
  return viewingSchoolId ? { 'x-viewing-school-id': String(viewingSchoolId) } : {};
}

export const leaderboardApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiClient.get(`/api/leaderboard${qs ? `?${qs}` : ''}`, { headers: viewingHeaders() });
  },
};
