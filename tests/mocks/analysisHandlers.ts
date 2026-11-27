import { http, HttpResponse } from 'msw';

import { analysisOptionsFixture } from './fixtures/analyses';
import { taskId } from './fixtures/tasks';

export const analysisHandlers = [
  http.get('*/api/v1/analyses/options', () => HttpResponse.json(analysisOptionsFixture)),
  http.post('*/api/v1/analyses', () =>
    HttpResponse.json({ taskId, statusUrl: `/api/v1/tasks/${taskId}` }, { status: 202 }),
  ),
];
