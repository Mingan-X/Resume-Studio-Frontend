import { useQuery } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
import { computed, toValue } from 'vue';

import { apiRequest } from '@/shared/api/client';
import { routeIdSchema } from '@/shared/lib/routeInput';

import { reportSchema } from '../model/contracts';

export const reportKeys = {
  detail: (id: string) => ['reports', 'detail', id] as const,
  lists: ['reports', 'list'] as const,
  revisions: (id: string) => ['reports', 'revisions', id] as const,
};
export function useReport(id: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => reportKeys.detail(toValue(id))),
    enabled: computed(() => routeIdSchema.safeParse(toValue(id)).success),
    retry: false,
    queryFn: ({ signal }) =>
      apiRequest(`/reports/${encodeURIComponent(toValue(id))}`, reportSchema, { signal }),
  });
}
