import { useQuery } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
import { computed, toValue } from 'vue';

import { zGetAnalysisOptionsResponse } from '@/generated/zod.gen';
import { apiRequest } from '@/shared/api/client';
import { contractError } from '@/shared/api/errors';
export function useResumeSource(version: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => ['reports', 'resume-source', toValue(version)]),
    enabled: false,
    retry: false,
    queryFn: async ({ signal }) => {
      let cursor: string | null = null;
      const seen = new Set<string>();
      do {
        const params = new URLSearchParams({ limit: '100' });
        if (cursor) params.set('resumeCursor', cursor);
        const page = await apiRequest(`/analyses/options?${params}`, zGetAnalysisOptionsResponse, {
          signal,
        });
        const found = page.resumes.find((item) => item.resumeVersionId === toValue(version));
        if (found) return found.resumeId;
        cursor = page.nextResumeCursor;
        if (cursor && seen.has(cursor)) throw contractError();
        if (cursor) seen.add(cursor);
      } while (cursor);
      return null;
    },
  });
}
