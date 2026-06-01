// api/example.api.js
// All fetch calls for the "example" resource in one place.
// Replace "example" with your resource name.
//
// These functions are called by TanStack Query hooks — never by components directly.
import { apiClient } from './client';

export const exampleApi = {
  getAll:   (page = 1, limit = 20) =>
    apiClient.get(`/api/examples?page=${page}&limit=${limit}`),

  getById:  (id) =>
    apiClient.get(`/api/examples/${id}`),

  create:   (data) =>
    apiClient.post('/api/examples', data),

  update:   (id, data) =>
    apiClient.patch(`/api/examples/${id}`, data),

  remove:   (id) =>
    apiClient.delete(`/api/examples/${id}`),
};
