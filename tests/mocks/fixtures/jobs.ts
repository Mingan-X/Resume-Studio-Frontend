import type { GetJobResponse, ListJobsResponse } from '../../../src/generated/types.gen';

export const jobId = '30000000-0000-4000-8000-000000000001',
  jobVersionId = '30000000-0000-4000-8000-000000000002',
  jobBlockId = '30000000-0000-4000-8000-000000000003';
export const jobText = '负责工程实践与自动化测试。';
export const jobFixture: GetJobResponse = {
  schemaVersion: 1,
  id: jobVersionId,
  jobId,
  version: 1,
  title: '合成工程师',
  city: null,
  level: null,
  skills: ['TypeScript'],
  createdAt: '2026-11-28T00:00:00.000Z',
  document: {
    schemaVersion: 1,
    sourceType: 'JD',
    sourceVersionId: jobVersionId,
    normalizationVersion: 'text-v1',
    chunkerVersion: 'jd-text-v1',
    textHash: 'a'.repeat(64),
    blocks: [
      {
        id: jobBlockId,
        ordinal: 0,
        text: jobText,
        textHash: 'a'.repeat(64),
        location: { kind: 'TEXT', paragraph: 0 },
      },
    ],
  },
  requirements: [
    {
      stableId: 'requirement-1',
      dimension: 'engineering',
      kind: 'SOFT',
      description: '工程实践与自动化测试',
      threshold: null,
      weight: 1,
      priority: 0,
      sourceRef: {
        sourceType: 'JD',
        sourceVersionId: jobVersionId,
        blockId: jobBlockId,
        start: 0,
        end: jobText.length,
        quote: jobText,
      },
    },
  ],
  dimensionWeights: [
    { dimension: 'technical_depth', weight: 1 },
    { dimension: 'engineering', weight: 1 },
    { dimension: 'business_understanding', weight: 1 },
    { dimension: 'project_impact', weight: 1 },
    { dimension: 'collaboration', weight: 1 },
    { dimension: 'growth', weight: 1 },
  ],
  hardRequirementsConfirmed: false,
  weightsConfirmed: false,
  status: 'DRAFT',
  contentHash: null,
  publishedAt: null,
  indexStatus: 'NOT_REQUESTED',
};
export const jobsFixture: ListJobsResponse = {
  items: [{ id: jobId, createdAt: jobFixture.createdAt, latestVersion: jobFixture }],
  nextCursor: null,
};
