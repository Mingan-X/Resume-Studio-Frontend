import { useQuery, useQueryClient } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
import { computed, onScopeDispose, ref, toValue, watch } from 'vue';

import { zTaskEvent } from '@/generated/zod.gen';
import { apiRequest } from '@/shared/api/client';
import { subscribeEvents } from '@/shared/api/events';
import { routeIdSchema } from '@/shared/lib/routeInput';

import type { Task } from '../model/task';
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
  const fallback = ref(false);
  watch(visible, (value) => {
    if (!value) void client.cancelQueries({ queryKey: key.value, exact: true });
  });
  const query = useQuery({
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
    refetchInterval: computed(() => {
      const polling = visible.value && fallback.value;
      return (query: { state: { error: unknown; data: { task: Task } | undefined } }) =>
        polling && !query.state.error && !isTerminal(query.state.data?.task.status) ? 2000 : false;
    }),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });
  let stop: (() => void) | undefined;
  let lastSeq = 0;
  function close() {
    stop?.();
    stop = undefined;
  }
  watch(
    () => toValue(taskId),
    () => {
      close();
      lastSeq = 0;
      fallback.value = false;
    },
  );
  watch(
    [() => toValue(taskId), visible, () => query.data.value?.task.status],
    () => {
      if (!visible.value || !query.data.value || isTerminal(query.data.value.task.status)) {
        close();
        return;
      }
      if (stop || fallback.value) return;
      stop = subscribeEvents(`/tasks/${encodeURIComponent(toValue(taskId))}/events`, {
        schema: zTaskEvent,
        eventName: 'task',
        onData: (event, id) => {
          if (event.taskId !== toValue(taskId) || String(event.seq) !== id || event.seq <= lastSeq)
            return;
          lastSeq = event.seq;
          void client.invalidateQueries({ queryKey: key.value, exact: true });
        },
        onFallback: () => {
          close();
          fallback.value = true;
        },
      });
    },
    { immediate: true },
  );
  onScopeDispose(close);
  return query;
}
