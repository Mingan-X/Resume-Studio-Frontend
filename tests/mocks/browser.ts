import { http, HttpResponse } from 'msw';
import { setupWorker } from 'msw/browser';
import { z } from 'zod';

import { queuedTask, retryTask } from './fixtures/tasks';
import { handlers } from './handlers';

export async function startMocks() {
  const scenario = z
    .enum(['healthy', 'offline', 'task-progress', 'task-retry', 'task-failed'])
    .catch('healthy')
    .parse(new URLSearchParams(window.location.search).get('scenario'));
  const worker = setupWorker(...handlers);
  if (scenario === 'offline') worker.use(http.get('*/health', () => HttpResponse.error()));
  let taskReads = 0;
  if (scenario.startsWith('task-'))
    worker.use(
      http.get('*/api/v1/tasks/:taskId', ({ params }) => {
        taskReads++;
        const task =
          scenario === 'task-retry'
            ? retryTask
            : {
                ...queuedTask,
                status: taskReads > 1 ? 'SUCCEEDED' : 'RUNNING',
                stage: taskReads > 1 ? 'SYNTHETIC_COMPLETED' : 'SYNTHETIC_RUNNING',
                progress: { completed: taskReads > 1 ? 1 : 0, total: 1 },
                attempt: 1,
              };
        return HttpResponse.json({ ...task, taskId: params.taskId });
      }),
    );
  await worker.start({ quiet: true, onUnhandledFrame: 'bypass' });
}
