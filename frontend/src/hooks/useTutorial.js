import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tutorialApi } from '../api/tutorial.api';

export const tutorialKeys = {
  progress: (tutorialKey, version) => ['tutorials', tutorialKey, version],
};

export function useTutorialProgress(tutorialKey, version, options = {}) {
  return useQuery({
    queryKey: tutorialKeys.progress(tutorialKey, version),
    queryFn: () => tutorialApi.getProgress(tutorialKey, version).then((res) => res.data),
    ...options,
  });
}

export function useSaveTutorialProgress(tutorialKey, version) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (progress) => tutorialApi.saveProgress(tutorialKey, {
      tutorialVersion: version,
      ...progress,
    }),
    onSuccess: (res) => queryClient.setQueryData(
      tutorialKeys.progress(tutorialKey, version),
      res.data,
    ),
  });
}

