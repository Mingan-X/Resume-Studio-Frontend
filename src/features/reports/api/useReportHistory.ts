import { useInfiniteQuery } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
import { computed, toValue } from 'vue';

import { zListReportsQuery, zListReportsResponse } from '@/generated/zod.gen';
import { apiRequest } from '@/shared/api/client';
import { routeIdSchema } from '@/shared/lib/routeInput';

import { reportKeys } from './useReport';
export function useReportHistory(reportId: MaybeRefOrGetter<string> = '') {
  return useInfiniteQuery({
    queryKey: computed(() =>
      toValue(reportId) ? reportKeys.revisions(toValue(reportId)) : reportKeys.lists,
    ),
    initialPageParam: '',
    retry: false,
    enabled: computed(
      () => !toValue(reportId) || routeIdSchema.safeParse(toValue(reportId)).success,
    ),
    queryFn: ({ pageParam, signal }) => {
      const query = zListReportsQuery.parse({
        limit: 20,
        ...(pageParam ? { cursor: pageParam } : {}),
      });
      const params = new URLSearchParams({ limit: String(query.limit) });
      if (query.cursor) params.set('cursor', query.cursor);
      return apiRequest(
        `/reports${toValue(reportId) ? `/${encodeURIComponent(toValue(reportId))}/revisions` : ''}?${params}`,
        zListReportsResponse,
        { signal },
      );
    },
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}
