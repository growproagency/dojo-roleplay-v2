import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolApi } from '../api/school.api';

export const schoolKeys = {
  detail: ['school'],
  members: ['school', 'members'],
  invites: ['school', 'invites'],
};

export function useSchool() {
  return useQuery({
    queryKey: schoolKeys.detail,
    queryFn: () => schoolApi.get().then(r => r.data),
  });
}

export function useUpdateSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => schoolApi.update(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: schoolKeys.detail }),
  });
}

export function useSchoolMembers(enabled = true) {
  return useQuery({
    queryKey: schoolKeys.members,
    queryFn: () => schoolApi.getMembers().then(r => r.data),
    enabled,
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId) => schoolApi.removeMember(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: schoolKeys.members }),
  });
}

export function useInvites(enabled = true) {
  return useQuery({
    queryKey: schoolKeys.invites,
    queryFn: () => schoolApi.getInvites().then(r => r.data),
    enabled,
  });
}

export function useCreateInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => schoolApi.createInvite(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: schoolKeys.invites }),
  });
}

export function useDeleteInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId) => schoolApi.deleteInvite(inviteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: schoolKeys.invites }),
  });
}
