import { http, HttpResponse } from 'msw';

import { reportFixture } from './fixtures/reports';

export const reportHandlers = [
  http.get('*/api/v1/reports/:reportId', () => HttpResponse.json(reportFixture)),
];
