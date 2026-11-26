import { useMutation, useQueryClient } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
import { toValue } from 'vue';

import { zCancelTaskRequest, zCancelTaskResponse } from '@/generated/zod.gen';
import { apiRequest } from '@/shared/api/client';
import { AppError } from '@/shared/api/errors';

import { taskKeys } from './keys';

export function useCancelTaskMutation(taskId: MaybeRefOrGetter<string>) {
  const client = useQueryClient();
  const refresh = () =>
    client.invalidateQueries({ queryKey: taskKeys.detail(toValue(taskId)), exact: true });
  return useMutation({
    mutationFn: () =>
      apiRequest(`/tasks/${encodeURIComponent(toValue(taskId))}/cancel`, zCancelTaskResponse, {
        method: 'POST',
        body: zCancelTaskRequest.parse({}),
        retries: 0,
      }),
    retry: false,
    onSuccess: refresh,
    onError: (error) => {
      if (error instanceof AppError && error.code === 'INVALID_STATE') return refresh();
    },
  });
}
