import type { CancelTaskResponse, TaskResponse } from '../../../src/generated/types.gen';

export const taskId = '00000000-0000-4000-8000-000000000002';
export const queuedTask: TaskResponse = {
  taskId,
  taskType: 'ANALYSIS',
  status: 'QUEUED',
  stage: 'QUEUED',
  progress: { completed: 0, total: null },
  attempt: 0,
  nextRetryAt: null,
  error: null,
  reportId: null,
  cancelRequested: false,
};
export const retryTask: TaskResponse = {
  ...queuedTask,
  status: 'RETRY_WAIT',
  stage: 'SYNTHETIC_RUNNING',
  attempt: 1,
  nextRetryAt: '2026-11-27T00:00:00.000Z',
  error: { code: 'UPSTREAM_TIMEOUT', message: '上游请求超时，等待重试', retryable: true },
  progress: { completed: 1, total: 3 },
};
export const terminalTasks: TaskResponse[] = ['SUCCEEDED', 'PARTIAL', 'FAILED', 'CANCELLED'].map(
  (status) => ({
    ...queuedTask,
    status:
      status === 'SUCCEEDED'
        ? 'SUCCEEDED'
        : status === 'PARTIAL'
          ? 'PARTIAL'
          : status === 'FAILED'
            ? 'FAILED'
            : 'CANCELLED',
    stage: 'SYNTHETIC_COMPLETED',
    attempt: 1,
    progress: { completed: 1, total: 1 },
  }),
);
export const cancelResponse: CancelTaskResponse = { taskId, cancelRequested: true };
