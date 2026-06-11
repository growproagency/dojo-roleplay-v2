import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolApi } from '../api/school.api';
import { useAuthStore } from '../store/auth.store';
import { useUIStore } from '../store/ui.store';

export const schoolKeys = {
  detail: ({ userId, schoolId }) => ['school', 'detail', userId, schoolId],
  members: ({ userId, schoolId }) => ['school', 'members', userId, schoolId],
  invites: ({ userId, schoolId }) => ['school', 'invites', userId, schoolId],
};

export function useSchool(enabled = true) {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const profileSchoolId = useAuthStore((s) => s.profile?.schoolId ?? s.profile?.school?.id ?? null);
  const viewingSchoolId = useUIStore((s) => s.viewingSchoolId);
  const schoolId = viewingSchoolId ?? profileSchoolId;
  return useQuery({
    queryKey: schoolKeys.detail({ userId, schoolId }),
    queryFn: () => schoolApi.get().then(r => r.data),
    enabled: enabled && !!userId && !!schoolId,
  });
}

export function useUpdateSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => schoolApi.update(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['school'] }),
  });
}

export function useSchoolMembers(enabled = true) {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const profileSchoolId = useAuthStore((s) => s.profile?.schoolId ?? s.profile?.school?.id ?? null);
  const viewingSchoolId = useUIStore((s) => s.viewingSchoolId);
  const schoolId = viewingSchoolId ?? profileSchoolId;
  return useQuery({
    queryKey: schoolKeys.members({ userId, schoolId }),
    queryFn: () => schoolApi.getMembers().then(r => r.data),
    enabled: enabled && !!userId && !!schoolId,
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId) => schoolApi.removeMember(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['school'] }),
  });
}

export function useInvites(enabled = true) {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const profileSchoolId = useAuthStore((s) => s.profile?.schoolId ?? s.profile?.school?.id ?? null);
  const viewingSchoolId = useUIStore((s) => s.viewingSchoolId);
  const schoolId = viewingSchoolId ?? profileSchoolId;
  return useQuery({
    queryKey: schoolKeys.invites({ userId, schoolId }),
    queryFn: () => schoolApi.getInvites().then(r => r.data),
    enabled: enabled && !!userId && !!schoolId,
  });
}

export function useCreateInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => schoolApi.createInvite(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['school'] }),
  });
}

export function useDeleteInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId) => schoolApi.deleteInvite(inviteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['school'] }),
  });
}
