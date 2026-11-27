import type {
  GetResumeVersionResponse,
  ListResumesResponse,
} from '../../../src/generated/types.gen';

export const resumeId = '10000000-0000-4000-8000-000000000001';
export const resumeVersionId = '10000000-0000-4000-8000-000000000002';
export const resumeFixture: GetResumeVersionResponse = {
  resumeId,
  resumeVersionId,
  version: 1,
  createdAt: '2026-11-28T00:00:00.000Z',
  file: { sha256: 'a'.repeat(64), mime: 'application/pdf', size: 1280 },
  extractedDocument: {
    schemaVersion: 1,
    sourceType: 'RESUME',
    sourceVersionId: resumeVersionId,
    fileHash: 'a'.repeat(64),
    parserVersion: 'synthetic-v1',
    normalizationVersion: 'text-v1',
    warnings: ['READING_ORDER_UNCERTAIN'],
    blocks: [
      {
        id: '10000000-0000-4000-8000-000000000003',
        ordinal: 0,
        text: '合成项目：维护测试与交付流程。',
        textHash: 'b'.repeat(64),
        location: { kind: 'PDF', page: 1, bounds: null },
      },
      {
        id: '10000000-0000-4000-8000-000000000004',
        ordinal: 1,
        text: '<script>danger()</script><img src=x onerror=danger()>',
        textHash: 'c'.repeat(64),
        location: { kind: 'PDF', page: 2, bounds: null },
      },
    ],
  },
};
export const resumeListFixture: ListResumesResponse = {
  items: [
    {
      id: resumeId,
      latestVersionId: resumeVersionId,
      version: 1,
      createdAt: resumeFixture.createdAt,
    },
  ],
  nextCursor: null,
};
