import { useInfiniteQuery, useMutation } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
import { ref, toValue, watch } from 'vue';

import { zGetAnalysisOptionsQuery } from '@/generated/zod.gen';
import { apiRequest } from '@/shared/api/client';

import type { CreateAnalysisData } from '../model/contracts';
import {
  analysisCreatedSchema,
  analysisInputSchema,
  analysisOptionsSchema,
} from '../model/contracts';

export const analysisKeys = {
  options: (kind: 'resumes' | 'corpora') => ['analyses', 'options', kind] as const,
};
export function useAnalysisOptions(kind: 'resumes' | 'corpora') {
  return useInfiniteQuery({
    queryKey: analysisKeys.options(kind),
    initialPageParam: '',
    retry: false,
    queryFn: ({ pageParam, signal }) => {
      const query = zGetAnalysisOptionsQuery.parse({
        limit: 20,
        ...(pageParam ? { [kind === 'resumes' ? 'resumeCursor' : 'corpusCursor']: pageParam } : {}),
      });
      const params = new URLSearchParams({ limit: String(query.limit) });
      if (query.resumeCursor) params.set('resumeCursor', query.resumeCursor);
      if (query.corpusCursor) params.set('corpusCursor', query.corpusCursor);
      return apiRequest(`/analyses/options?${params}`, analysisOptionsSchema, { signal });
    },
    getNextPageParam: (page) =>
      (kind === 'resumes' ? page.nextResumeCursor : page.nextCorpusCursor) ?? undefined,
  });
}
export function useCreateAnalysisMutation(input: MaybeRefOrGetter<CreateAnalysisData['body']>) {
  const key = ref(crypto.randomUUID());
  watch(
    () => JSON.stringify(toValue(input)),
    () => {
      key.value = crypto.randomUUID();
    },
    { flush: 'sync' },
  );
  return useMutation({
    retry: false,
    mutationFn: () =>
      apiRequest('/analyses', analysisCreatedSchema, {
        method: 'POST',
        body: analysisInputSchema.parse(toValue(input)),
        idempotencyKey: key.value,
      }),
  });
}
