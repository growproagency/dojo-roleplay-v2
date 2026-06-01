import { apiClient } from './client';

export const schoolApi = {
  get:          ()            => apiClient.get('/api/school'),
  update:       (data)        => apiClient.put('/api/school', data),
  getMembers:   ()            => apiClient.get('/api/school/members'),
  removeMember: (userId)      => apiClient.delete(`/api/school/members/${userId}`),
  getInvites:   ()            => apiClient.get('/api/school/invites'),
  createInvite: (data)        => apiClient.post('/api/school/invites', data),
  deleteInvite: (inviteId)    => apiClient.delete(`/api/school/invites/${inviteId}`),
};
