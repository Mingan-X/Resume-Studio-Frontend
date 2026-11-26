import { useQuery } from '@tanstack/vue-query';

import { apiRequest } from '@/shared/api/client';

import { healthSchema } from '../model/health';

export const systemKeys = { health: ['system', 'health'] as const };

export function useHealth() {
  return useQuery({
    queryKey: systemKeys.health,
    retry: false,
    queryFn: ({ signal }) => apiRequest('/health', healthSchema, { signal }),
  });
}
