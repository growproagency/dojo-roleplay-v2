import { useQuery, useMutation } from '@tanstack/react-query';
import { invitesApi } from '../api/invites.api';

export function useInvitePreview(token) {
  return useQuery({
    queryKey: ['invite', token],
    queryFn: () => invitesApi.preview(token).then(r => r.data),
    enabled: !!token,
  });
}

export function useAcceptInvite() {
  return useMutation({
    mutationFn: ({ token, data }) => invitesApi.accept(token, data),
  });
}
