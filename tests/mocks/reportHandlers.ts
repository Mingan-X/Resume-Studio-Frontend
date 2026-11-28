import { http, HttpResponse } from 'msw';

import { reportFixture } from './fixtures/reports';

export const derivedReport = {
  ...structuredClone(reportFixture),
  id: '40000000-0000-4000-8000-000000000099',
  revision: 2,
  sourceReportId: reportFixture.id,
};
export const reportHandlers = [
  http.get('*/api/v1/reports', () =>
    HttpResponse.json({
      items: [derivedReport, reportFixture].map((report) => ({
        id: report.id,
        taskId: report.taskId,
        revision: report.revision,
        rootReportId: report.rootReportId,
        sourceReportId: report.sourceReportId,
        createdAt: report.createdAt,
        status: report.content.status,
        resumeVersionId: report.content.input.resumeVersionId,
        topCount: 1,
        warnings: report.content.warnings,
      })),
      nextCursor: null,
    }),
  ),
  http.get('*/api/v1/reports/:reportId/revisions', () =>
    HttpResponse.json({
      items: [derivedReport, reportFixture].map((report) => ({
        id: report.id,
        taskId: report.taskId,
        revision: report.revision,
        rootReportId: report.rootReportId,
        sourceReportId: report.sourceReportId,
        createdAt: report.createdAt,
        status: report.content.status,
        resumeVersionId: report.content.input.resumeVersionId,
        topCount: 1,
        warnings: report.content.warnings,
      })),
      nextCursor: null,
    }),
  ),
  http.get('*/api/v1/reports/:reportId', ({ params }) =>
    HttpResponse.json(params.reportId === derivedReport.id ? derivedReport : reportFixture),
  ),
  http.post('*/api/v1/reports/:reportId/recompute', () =>
    HttpResponse.json(derivedReport, { status: 201 }),
  ),
];
