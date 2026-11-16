import { apiClient } from './client';
import reportFontUrl from '../assets/fonts/NotoSans-Regular.ttf?url';

export const monthlyReportsApi = {
  list: params => apiClient.get(`/api/monthly-reports?${new URLSearchParams(params)}`),
  detail: (userId, params) => apiClient.get(`/api/monthly-reports/${encodeURIComponent(userId)}?${new URLSearchParams(params)}`),
  updateSettings: body => apiClient.put('/api/monthly-reports/settings', body),
  loadFont: () => apiClient.getAsset(reportFontUrl),
};
