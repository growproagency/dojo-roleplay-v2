import { useQuery } from '@tanstack/react-query';
import { leaderboardApi } from '../api/leaderboard.api';
import { useAuthStore } from '../store/auth.store';

export const leaderboardKeys = {
  list: ({ params, userId, schoolId, viewingSchoolId }) => ['leaderboard', params, userId, schoolId, viewingSchoolId],
};

export function useLeaderboard(params = {}) {
  const userId = useAuthStore(s => s.user?.id ?? null);
  const schoolId = useAuthStore(s => s.profile?.schoolId ?? null);
  const viewingSchoolId = useAuthStore(s => s.profile?._viewingSchoolId ?? null);

  return useQuery({
    queryKey: leaderboardKeys.list({ params, userId, schoolId, viewingSchoolId }),
    queryFn: () => leaderboardApi.list(params).then(r => r.data),
    enabled: !!userId,
  });
}
