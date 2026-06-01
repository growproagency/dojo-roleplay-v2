import { apiClient } from './client';

export const invitesApi = {
  preview: (token)         => apiClient.get(`/api/invites/${token}`),
  accept:  (token, data)   => apiClient.post(`/api/invites/${token}/accept`, data),
};
