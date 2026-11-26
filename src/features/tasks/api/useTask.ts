import { useQuery, useQueryClient } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
import { computed, onScopeDispose, ref, toValue, watch } from 'vue';

import { apiRequest } from '@/shared/api/client';
import { routeIdSchema } from '@/shared/lib/routeInput';

import { isTerminal, taskSchema } from '../model/task';
import { taskKeys } from './keys';

export function useTask(taskId: MaybeRefOrGetter<string>) {
  const client = useQueryClient();
  const visible = ref(document.visibilityState !== 'hidden');
  const updateVisibility = () => {
    visible.value = document.visibilityState !== 'hidden';
  };
  document.addEventListener('visibilitychange', updateVisibility);
  onScopeDispose(() => document.removeEventListener('visibilitychange', updateVisibility));
  const key = computed(() => taskKeys.detail(toValue(taskId)));
  watch(visible, (value) => {
    if (!value) void client.cancelQueries({ queryKey: key.value, exact: true });
  });
  return useQuery({
    queryKey: key,
    enabled: computed(() => visible.value && routeIdSchema.safeParse(toValue(taskId)).success),
    queryFn: async ({ signal }) => {
      let requestId: string | undefined;
      const task = await apiRequest(`/tasks/${encodeURIComponent(toValue(taskId))}`, taskSchema, {
        signal,
        onRequestId: (value) => {
          requestId = value;
        },
      });
      return { task, requestId };
    },
    retry: false,
    refetchInterval: (query) =>
      visible.value && !query.state.error && !isTerminal(query.state.data?.task.status)
        ? 2000
        : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });
}
