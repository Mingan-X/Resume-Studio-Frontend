import { useMutation, useQueryClient } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
import { ref, toValue, watch } from 'vue';

import type { RecomputeReportData } from '@/generated/types.gen';
import { zRecomputeReportBody } from '@/generated/zod.gen';
import { apiRequest } from '@/shared/api/client';

import { reportSchema } from '../model/contracts';
import { reportKeys } from './useReport';
export function useRecompute(
  id: MaybeRefOrGetter<string>,
  input: MaybeRefOrGetter<RecomputeReportData['body']>,
) {
  const client = useQueryClient(),
    key = ref(crypto.randomUUID());
  watch(
    () => `${toValue(id)}:${JSON.stringify(toValue(input))}`,
    () => {
      key.value = crypto.randomUUID();
    },
    { flush: 'sync' },
  );
  return useMutation({
    retry: false,
    mutationFn: () =>
      apiRequest(`/reports/${encodeURIComponent(toValue(id))}/recompute`, reportSchema, {
        method: 'POST',
        body: zRecomputeReportBody.parse(toValue(input)),
        idempotencyKey: key.value,
      }),
    onSuccess: async (report) => {
      client.setQueryData(reportKeys.detail(report.id), report);
      await client.invalidateQueries({ queryKey: reportKeys.lists, exact: true });
      await client.invalidateQueries({ queryKey: reportKeys.revisions(toValue(id)), exact: true });
    },
  });
}
