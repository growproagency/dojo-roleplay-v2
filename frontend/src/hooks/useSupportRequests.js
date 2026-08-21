import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supportRequestsApi } from '../api/supportRequests.api';

export const supportRequestKeys = {
  all: ['support-requests'],
  mine: ['support-requests', 'mine'],
};

export function useSupportRequests() {
  return useQuery({ queryKey: supportRequestKeys.mine, queryFn: () => supportRequestsApi.listMine().then((r) => r.data) });
}

export function useCreateSupportRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supportRequestsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: supportRequestKeys.all }),
  });
}
