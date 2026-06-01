import { useQuery } from '@tanstack/react-query';
import { systemApi } from '../api/system.api';

export const systemKeys = {
  status: ['system', 'status'],
};

export function useSystemStatus(options = {}) {
  return useQuery({
    queryKey: systemKeys.status,
    queryFn: () => systemApi.getStatus().then(r => r.data),
    ...options,
  });
}
