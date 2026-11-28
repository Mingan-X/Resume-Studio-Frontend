import { useMutation, useQueryClient } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
import { ref, toValue, watch } from 'vue';

import {
  zConfirmJobBody,
  zCreateJobBody,
  zEditJobDraftBody,
  zPublishJobResponse,
  zSuggestJobRequirementsResponse,
} from '@/generated/zod.gen';
import { apiRequest } from '@/shared/api/client';

import type {
  ConfirmJobData,
  CreateJobData,
  EditJobDraftData,
  JobVersion,
} from '../model/contracts';
import { jobSchema } from '../model/contracts';
import { jobKeys } from './keys';

function useSaveJob() {
  const client = useQueryClient();
  return async (data: JobVersion) => {
    client.setQueryData(jobKeys.detail(data.jobId), data);
    client.setQueryData(jobKeys.detail(data.jobId, data.id), data);
    await client.invalidateQueries({ queryKey: jobKeys.lists, exact: true });
  };
}
function versionPath(job: JobVersion) {
  return `/jobs/${encodeURIComponent(job.jobId)}/versions/${encodeURIComponent(job.id)}`;
}
export function useCreateJobMutation() {
  return useMutation({
    retry: false,
    mutationFn: (body: CreateJobData['body']) =>
      apiRequest('/jobs', jobSchema, { method: 'POST', body: zCreateJobBody.parse(body) }),
    onSuccess: useSaveJob(),
  });
}
export function useEditJobMutation() {
  return useMutation({
    retry: false,
    mutationFn: ({ job, body }: { job: JobVersion; body: EditJobDraftData['body'] }) =>
      apiRequest(versionPath(job), jobSchema, {
        method: 'PATCH',
        body: zEditJobDraftBody.parse(body),
      }),
    onSuccess: useSaveJob(),
  });
}
export function useConfirmJobMutation() {
  return useMutation({
    retry: false,
    mutationFn: ({ job, body }: { job: JobVersion; body: ConfirmJobData['body'] }) =>
      apiRequest(`${versionPath(job)}/confirm`, jobSchema, {
        method: 'POST',
        body: zConfirmJobBody.parse(body),
      }),
    onSuccess: useSaveJob(),
  });
}
export function useSuggestJobMutation() {
  return useMutation({
    retry: false,
    mutationFn: (job: JobVersion) =>
      apiRequest(`${versionPath(job)}/suggestions`, zSuggestJobRequirementsResponse, {
        method: 'POST',
        body: {},
      }),
  });
}
export function usePublishJobMutation(job: MaybeRefOrGetter<JobVersion>) {
  const client = useQueryClient(),
    key = ref(crypto.randomUUID());
  watch(
    () =>
      JSON.stringify([
        toValue(job).id,
        toValue(job).title,
        toValue(job).city,
        toValue(job).level,
        toValue(job).skills,
        toValue(job).document,
        toValue(job).requirements,
        toValue(job).dimensionWeights,
      ]),
    () => {
      key.value = crypto.randomUUID();
    },
  );
  return useMutation({
    retry: false,
    mutationFn: () =>
      apiRequest(`${versionPath(toValue(job))}/publish`, zPublishJobResponse, {
        method: 'POST',
        body: {},
        idempotencyKey: key.value,
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: jobKeys.detail(toValue(job).jobId), exact: true });
      await client.invalidateQueries({
        queryKey: jobKeys.detail(toValue(job).jobId, toValue(job).id),
        exact: true,
      });
      await client.invalidateQueries({ queryKey: jobKeys.lists, exact: true });
    },
  });
}
