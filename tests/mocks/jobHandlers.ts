import { http, HttpResponse } from 'msw';

import { jobFixture, jobsFixture } from './fixtures/jobs';

export const jobHandlers = [
  http.get('*/api/v1/jobs', () => HttpResponse.json(jobsFixture)),
  http.get('*/api/v1/jobs/:jobId', () => HttpResponse.json(jobFixture)),
  http.get('*/api/v1/jobs/:jobId/versions/:versionId', () => HttpResponse.json(jobFixture)),
];
