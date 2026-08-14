import { apiClient } from './client';

export const tutorialApi = {
  getProgress: (tutorialKey, version) =>
    apiClient.get(`/api/tutorials/${tutorialKey}/progress?version=${version}`),
  saveProgress: (tutorialKey, data) =>
    apiClient.put(`/api/tutorials/${tutorialKey}/progress`, data),
};

