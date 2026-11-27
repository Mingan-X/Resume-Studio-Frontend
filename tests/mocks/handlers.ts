import { http, HttpResponse } from 'msw';

import { queuedTask } from './fixtures/tasks';
import { jobHandlers } from './jobHandlers';
import { resumeHandlers } from './resumeHandlers';

export const healthyResponse = { status: 'ok', service: 'api', environment: 'test' } as const;
export const handlers = [
  ...resumeHandlers,
  ...jobHandlers,
  http.get('*/health', () => HttpResponse.json(healthyResponse)),
  http.get('*/api/v1/tasks/:taskId', ({ params }) =>
    HttpResponse.json(
      { ...queuedTask, taskId: params.taskId },
      { headers: { 'x-request-id': '00000000-0000-4000-8000-000000000001' } },
    ),
  ),
];
