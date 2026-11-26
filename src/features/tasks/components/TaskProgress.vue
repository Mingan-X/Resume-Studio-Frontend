<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import { AppError } from '@/shared/api/errors';
import ErrorNotice from '@/shared/ui/ErrorNotice.vue';
import RequestState from '@/shared/ui/RequestState.vue';

import { useTask } from '../api/useTask';
import { retryTime, stageLabel, statusLabels } from '../model/task';

const props = defineProps<{ taskId: string }>();
const { data, error, isPending, isFetching, refetch } = useTask(() => props.taskId);
const task = computed(() => data.value?.task);
const taskError = computed(() =>
  task.value?.error
    ? new AppError({ kind: 'http', ...task.value.error, requestId: data.value?.requestId })
    : null,
);
</script>

<template>
  <RequestState :pending="isPending" :error="error" @retry="refetch()">
    <section v-if="task" aria-labelledby="task-title" aria-live="polite" :aria-busy="isFetching">
      <h1 id="task-title">任务进度</h1>
      <p class="status">{{ statusLabels[task.status] }}</p>
      <dl>
        <div>
          <dt>当前阶段</dt>
          <dd>{{ stageLabel(task.stage) }}</dd>
        </div>
        <div>
          <dt>已完成</dt>
          <dd>
            {{ task.progress.completed
            }}<template v-if="task.progress.total !== null"> / {{ task.progress.total }}</template>
          </dd>
        </div>
        <div>
          <dt>尝试次数</dt>
          <dd>{{ task.attempt }}</dd>
        </div>
        <div v-if="task.nextRetryAt">
          <dt>下次重试</dt>
          <dd>
            <time :datetime="task.nextRetryAt" :title="task.nextRetryAt">{{
              retryTime(task.nextRetryAt)
            }}</time>
          </dd>
        </div>
      </dl>
      <ErrorNotice v-if="taskError" :error="taskError" @retry="refetch()" />
      <p v-if="task.cancelRequested && task.status !== 'CANCELLED'">
        取消请求已提交，正在等待安全停止。
      </p>
      <RouterLink v-if="task.reportId" :to="`/reports/${task.reportId}`">查看报告</RouterLink>
      <button type="button" :disabled="isFetching" @click="refetch()">刷新状态</button>
    </section>
  </RequestState>
</template>

<style scoped>
section {
  max-width: 54rem;
}
.status {
  font-weight: 650;
  color: var(--brand);
}
dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-6);
  background: var(--surface);
  border: 1px solid var(--border);
  padding: var(--space-6);
  border-radius: var(--radius);
}
dt {
  color: var(--text-muted);
}
dd {
  margin: var(--space-2) 0 0;
  font-weight: 600;
}
</style>
