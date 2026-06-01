import { apiClient } from './client';

export const adminApi = {
  listSchools:            (status = 'active') => apiClient.get(`/api/admin/schools?status=${encodeURIComponent(status)}`),
  createSchool:           (data)          => apiClient.post('/api/admin/schools', data),
  getSchool:              (id)            => apiClient.get(`/api/admin/schools/${id}`),
  updateSchool:           (id, data)      => apiClient.put(`/api/admin/schools/${id}`, data),
  archiveSchool:          (id)            => apiClient.delete(`/api/admin/schools/${id}`),
  restoreSchool:          (id)            => apiClient.put(`/api/admin/schools/${id}/restore`, {}),
  getUsage:               ()              => apiClient.get('/api/admin/usage'),
  getPlatformSettings:    ()              => apiClient.get('/api/admin/platform-settings'),
  updatePlatformSettings: (data)          => apiClient.put('/api/admin/platform-settings', data),
  changeUserRole:         (userId, role)  => apiClient.put(`/api/admin/users/${userId}/role`, { role }),
  removeUserFromSchool:   (userId)        => apiClient.put(`/api/admin/users/${userId}/school`, { schoolId: null }),
  createPasswordResetLink: (email)         => apiClient.post('/api/admin/users/password-reset-link', { email }),
  createSchoolInvite:     (schoolId, data) => apiClient.post(`/api/admin/schools/${schoolId}/invites`, data),
  readdSchoolUser:        (schoolId, data) => apiClient.post(`/api/admin/schools/${schoolId}/users/readd`, data),
  revokeSchoolInvite:     (schoolId, inviteId) => apiClient.delete(`/api/admin/schools/${schoolId}/invites/${inviteId}`),
  getSchoolInvites:       (schoolId)      => apiClient.get(`/api/admin/schools/${schoolId}/invites`),
  getPlatformAdmins:      ()              => apiClient.get('/api/admin/platform-admins'),
  createPlatformAdminInvite: (data)       => apiClient.post('/api/admin/platform-admins/invites', data),
  revokePlatformAdmin:    (userId)        => apiClient.delete(`/api/admin/platform-admins/${userId}`),
  revokePlatformAdminInvite: (inviteId)   => apiClient.delete(`/api/admin/platform-admins/invites/${inviteId}`),
};
