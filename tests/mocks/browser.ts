import { http, HttpResponse } from 'msw';
import { setupWorker } from 'msw/browser';
import { z } from 'zod';

import { authFlowHandlers } from './authFlow';
import { resumeFixture } from './fixtures/resumes';
import { queuedTask, retryTask } from './fixtures/tasks';
import { handlers } from './handlers';
import { jobFlowHandlers } from './jobFlow';

export async function startMocks() {
  const scenario = z
    .enum([
      'healthy',
      'offline',
      'task-progress',
      'task-retry',
      'task-cancel',
      'task-cancel-race',
      'resume-flow',
      'job-flow',
      'auth-flow',
    ])
    .catch('healthy')
    .parse(new URLSearchParams(window.location.search).get('scenario'));
  const worker = setupWorker(...handlers);
  if (scenario === 'auth-flow') worker.use(...authFlowHandlers());
  if (scenario === 'job-flow') worker.use(...jobFlowHandlers());
  if (scenario === 'resume-flow') {
    let uploaded = false;
    worker.use(
      http.get('*/api/v1/resumes', () =>
        HttpResponse.json({
          items: uploaded
            ? [
                {
                  id: resumeFixture.resumeId,
                  latestVersionId: resumeFixture.resumeVersionId,
                  version: 1,
                  createdAt: resumeFixture.createdAt,
                },
              ]
            : [],
          nextCursor: null,
        }),
      ),
      http.post('*/api/v1/resumes', () => {
        uploaded = true;
        return HttpResponse.json(resumeFixture, { status: 201 });
      }),
    );
  }
  if (scenario === 'offline') worker.use(http.get('*/health', () => HttpResponse.error()));
  let taskReads = 0;
  let cancelRequested = false;
  if (scenario === 'task-cancel' || scenario === 'task-cancel-race') {
    worker.use(
      http.get('*/api/v1/tasks/:taskId', ({ params }) =>
        HttpResponse.json({
          ...queuedTask,
          taskId: params.taskId,
          status: scenario === 'task-cancel-race' && cancelRequested ? 'SUCCEEDED' : 'RUNNING',
          cancelRequested,
        }),
      ),
      http.post('*/api/v1/tasks/:taskId/cancel', ({ params }) => {
        cancelRequested = true;
        return scenario === 'task-cancel-race'
          ? HttpResponse.json(
              {
                code: 'INVALID_STATE',
                message: '任务已结束',
                retryable: false,
                requestId: '00000000-0000-4000-8000-000000000001',
              },
              { status: 409 },
            )
          : HttpResponse.json({ taskId: params.taskId, cancelRequested: true }, { status: 202 });
      }),
    );
  }
  if (scenario === 'task-progress' || scenario === 'task-retry')
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
