import { useInfiniteQuery, useQuery } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
import { computed, toValue } from 'vue';

import { zListJobsQuery } from '@/generated/zod.gen';
import { apiRequest } from '@/shared/api/client';
import { routeIdSchema } from '@/shared/lib/routeInput';

import { jobSchema, jobsSchema } from '../model/contracts';
import { jobKeys } from './keys';

export function useJobs() {
  return useInfiniteQuery({
    queryKey: jobKeys.lists,
    initialPageParam: '',
    retry: false,
    queryFn: ({ pageParam, signal }) => {
      const query = zListJobsQuery.parse({
        limit: 20,
        ...(pageParam ? { cursor: pageParam } : {}),
      });
      const params = new URLSearchParams({ limit: String(query.limit) });
      if (query.cursor) params.set('cursor', query.cursor);
      return apiRequest(`/jobs?${params}`, jobsSchema, { signal });
    },
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}
export function useJob(id: MaybeRefOrGetter<string>, version: MaybeRefOrGetter<string> = '') {
  return useQuery({
    queryKey: computed(() => jobKeys.detail(toValue(id), toValue(version))),
    retry: false,
    enabled: computed(
      () =>
        routeIdSchema.safeParse(toValue(id)).success &&
        (!toValue(version) || routeIdSchema.safeParse(toValue(version)).success),
    ),
    queryFn: ({ signal }) =>
      apiRequest(
        `/jobs/${encodeURIComponent(toValue(id))}${toValue(version) ? `/versions/${encodeURIComponent(toValue(version))}` : ''}`,
        jobSchema,
        { signal },
      ),
  });
}
