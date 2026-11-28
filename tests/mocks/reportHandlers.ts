import { http, HttpResponse } from 'msw';

import { reportFixture } from './fixtures/reports';

export const derivedReport = {
  ...structuredClone(reportFixture),
  id: '40000000-0000-4000-8000-000000000099',
  revision: 2,
  sourceReportId: reportFixture.id,
};
export const reportHandlers = [
  http.get('*/api/v1/reports/:reportId', ({ params }) =>
    HttpResponse.json(params.reportId === derivedReport.id ? derivedReport : reportFixture),
  ),
  http.post('*/api/v1/reports/:reportId/recompute', () =>
    HttpResponse.json(derivedReport, { status: 201 }),
  ),
];
