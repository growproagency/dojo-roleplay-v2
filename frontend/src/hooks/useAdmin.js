import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';

export const adminKeys = {
  schools: (status = 'active') => ['admin', 'schools', status],
  school: (id) => ['admin', 'schools', id],
  schoolInvites: (id) => ['admin', 'school-invites', id],
  platformAdmins: ['admin', 'platform-admins'],
  usage: ['admin', 'usage'],
  platformSettings: ['admin', 'platform-settings'],
};

export function useAdminSchools(enabled = true, status = 'active') {
  return useQuery({
    queryKey: adminKeys.schools(status),
    queryFn: () => adminApi.listSchools(status).then(r => r.data),
    enabled,
  });
}

export function useAdminSchool(id) {
  return useQuery({
    queryKey: adminKeys.school(id),
    queryFn: () => adminApi.getSchool(id).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreateAdminSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminApi.createSchool(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'schools'] }),
  });
}

export function useUpdateAdminSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => adminApi.updateSchool(id, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'schools'] });
      qc.invalidateQueries({ queryKey: adminKeys.school(id) });
    },
  });
}

export function useResetSchoolUsagePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminApi.resetSchoolUsagePeriod(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: adminKeys.school(id) });
      qc.invalidateQueries({ queryKey: adminKeys.usage });
      qc.invalidateQueries({ queryKey: ['admin', 'schools'] });
    },
  });
}

export function useAdminUsage() {
  return useQuery({
    queryKey: adminKeys.usage,
    queryFn: () => adminApi.getUsage().then(r => r.data),
  });
}

export function useArchiveAdminSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminApi.archiveSchool(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'schools'] });
      qc.invalidateQueries({ queryKey: adminKeys.usage });
    },
  });
}

export function useRestoreAdminSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminApi.restoreSchool(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'schools'] });
      qc.invalidateQueries({ queryKey: adminKeys.usage });
    },
  });
}

export function useAdminSchoolInvites(schoolId) {
  return useQuery({
    queryKey: adminKeys.schoolInvites(schoolId),
    queryFn: () => adminApi.getSchoolInvites(schoolId).then(r => r.data),
    enabled: !!schoolId,
  });
}

export function useChangeUserRole(schoolId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }) => adminApi.changeUserRole(userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.school(schoolId) }),
  });
}

export function useRemoveUserFromSchool(schoolId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId) => adminApi.removeUserFromSchool(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.school(schoolId) }),
  });
}

export function useCreatePasswordResetLink() {
  return useMutation({
    mutationFn: (email) => adminApi.createPasswordResetLink(email),
  });
}

export function useCreateSchoolInvite(schoolId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminApi.createSchoolInvite(schoolId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.schoolInvites(schoolId) }),
  });
}

export function useReaddSchoolUser(schoolId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminApi.readdSchoolUser(schoolId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.school(schoolId) }),
  });
}

export function useRevokeSchoolInvite(schoolId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId) => adminApi.revokeSchoolInvite(schoolId, inviteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.schoolInvites(schoolId) }),
  });
}

export function usePlatformAdmins(enabled = true) {
  return useQuery({
    queryKey: adminKeys.platformAdmins,
    queryFn: () => adminApi.getPlatformAdmins().then(r => r.data),
    enabled,
  });
}

export function useCreatePlatformAdminInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminApi.createPlatformAdminInvite(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.platformAdmins }),
  });
}

export function useRevokePlatformAdminInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId) => adminApi.revokePlatformAdminInvite(inviteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.platformAdmins }),
  });
}

export function useRevokePlatformAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId) => adminApi.revokePlatformAdmin(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.platformAdmins }),
  });
}

export function usePlatformSettings() {
  return useQuery({
    queryKey: adminKeys.platformSettings,
    queryFn: () => adminApi.getPlatformSettings().then(r => r.data),
  });
}

export function useUpdatePlatformSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminApi.updatePlatformSettings(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.platformSettings }),
  });
}
