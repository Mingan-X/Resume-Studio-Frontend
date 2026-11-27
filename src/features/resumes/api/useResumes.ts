import { useInfiniteQuery } from '@tanstack/vue-query';

import { zListResumesQuery } from '@/generated/zod.gen';
import { apiRequest } from '@/shared/api/client';

import { resumeListSchema } from '../model/contracts';
import { resumeKeys } from './keys';

export function useResumes() {
  return useInfiniteQuery({
    queryKey: resumeKeys.lists,
    initialPageParam: '',
    retry: false,
    queryFn: ({ pageParam, signal }) => {
      const query = zListResumesQuery.parse({
        limit: 20,
        ...(pageParam ? { cursor: pageParam } : {}),
      });
      const params = new URLSearchParams({ limit: String(query.limit) });
      if (query.cursor) params.set('cursor', query.cursor);
      return apiRequest(`/resumes?${params}`, resumeListSchema, { signal });
    },
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}
