import { http, HttpResponse } from 'msw';

import { resumeFixture, resumeListFixture } from './fixtures/resumes';

export const resumeHandlers = [
  http.get('*/api/v1/resumes', () => HttpResponse.json(resumeListFixture)),
  http.get('*/api/v1/resumes/:resumeId/versions/:versionId', () =>
    HttpResponse.json(resumeFixture),
  ),
  http.post('*/api/v1/resumes', () => HttpResponse.json(resumeFixture, { status: 201 })),
];
