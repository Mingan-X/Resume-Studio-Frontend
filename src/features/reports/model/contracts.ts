import type { GetReportResponse } from '@/generated/types.gen';

export type Report = GetReportResponse;
export type ReportContent = Report['content'];
export type EvidenceRef = ReportContent['parsedResume']['education'][number]['sourceRefs'][number];
export type ScoreResult = NonNullable<ReportContent['ranking']>['results'][number];
export type Dimension = NonNullable<ReportContent['profile']>['scores'][number]['dimension'];
export { zGetReportResponse as reportSchema } from '@/generated/zod.gen';
