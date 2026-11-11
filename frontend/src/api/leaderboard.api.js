import { apiClient } from './client';

export const leaderboardApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiClient.get(`/api/leaderboard${qs ? `?${qs}` : ''}`);
  },
};
