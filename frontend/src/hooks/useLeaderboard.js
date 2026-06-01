import { useQuery } from '@tanstack/react-query';
import { leaderboardApi } from '../api/leaderboard.api';

export const leaderboardKeys = {
  list: (params) => ['leaderboard', params],
};

export function useLeaderboard(params = {}) {
  return useQuery({
    queryKey: leaderboardKeys.list(params),
    queryFn: () => leaderboardApi.list(params).then(r => r.data),
  });
}
