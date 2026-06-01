import { apiClient } from './client';

export const authApi = {
  getMe:        ()     => apiClient.get('/api/auth/me'),
  updateMe:     (data) => apiClient.put('/api/auth/me', data),
  logout:       ()     => apiClient.post('/api/auth/logout'),
};
