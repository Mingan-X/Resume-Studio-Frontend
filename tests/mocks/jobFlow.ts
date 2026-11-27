import { http, HttpResponse } from 'msw';

import { zCreateJobBody, zEditJobDraftBody } from '../../src/generated/zod.gen';
import { jobFixture, jobId, jobVersionId } from './fixtures/jobs';

export function jobFlowHandlers() {
  let current = structuredClone(jobFixture);
  return [
    http.get('*/api/v1/jobs', () =>
      HttpResponse.json({
        items: [{ id: current.jobId, createdAt: current.createdAt, latestVersion: current }],
        nextCursor: null,
      }),
    ),
    http.get('*/api/v1/jobs/:jobId', () => HttpResponse.json(current)),
    http.get('*/api/v1/jobs/:jobId/versions/:versionId', () => HttpResponse.json(current)),
    http.post('*/api/v1/jobs', async ({ request }) => {
      const body = zCreateJobBody.parse(await request.json());
      current = {
        ...structuredClone(jobFixture),
        ...body,
        id: jobVersionId,
        jobId,
        requirements: [],
        document: {
          ...jobFixture.document,
          blocks: jobFixture.document.blocks.map((block) => ({ ...block, text: body.body })),
        },
      };
      return HttpResponse.json(current, { status: 201 });
    }),
    http.patch('*/api/v1/jobs/:jobId/versions/:versionId', async ({ request }) => {
      const body = zEditJobDraftBody.parse(await request.json());
      if (current.status === 'PUBLISHED') {
        current = {
          ...current,
          id: '30000000-0000-4000-8000-000000000009',
          version: current.version + 1,
          status: 'DRAFT',
          indexStatus: 'NOT_REQUESTED',
          publishedAt: null,
          contentHash: null,
        };
      }
      switch (body.kind) {
        case 'metadata':
          current = { ...current, ...body.metadata };
          break;
        case 'body':
          current = {
            ...current,
            document: {
              ...current.document,
              blocks: current.document.blocks.map((block) => ({ ...block, text: body.body })),
            },
          };
          break;
        case 'requirement-upsert':
          current = {
            ...current,
            requirements: [
              ...current.requirements.filter((item) => item.stableId !== body.requirement.stableId),
              body.requirement,
            ],
          };
          break;
        case 'requirement-delete':
          current = {
            ...current,
            requirements: current.requirements.filter((item) => item.stableId !== body.stableId),
          };
          break;
        case 'weights':
          current = { ...current, dimensionWeights: body.dimensionWeights };
          break;
      }
      return HttpResponse.json(current);
    }),
    http.post('*/api/v1/jobs/:jobId/versions/:versionId/confirm', () => {
      current = { ...current, hardRequirementsConfirmed: true, weightsConfirmed: true };
      return HttpResponse.json(current);
    }),
    http.post('*/api/v1/jobs/:jobId/versions/:versionId/publish', () => {
      current = {
        ...current,
        status: 'PUBLISHED',
        indexStatus: 'PENDING',
        publishedAt: '2026-11-28T00:00:00.000Z',
        contentHash: 'b'.repeat(64),
      };
      return HttpResponse.json(
        { jobVersionId: current.id, taskId: '30000000-0000-4000-8000-000000000004' },
        { status: 202 },
      );
    }),
    http.post('*/api/v1/jobs/:jobId/versions/:versionId/suggestions', () =>
      HttpResponse.json(
        {
          code: 'MODEL_UNAVAILABLE',
          message: '未配置抽取模型，可手工录入要求',
          retryable: true,
          requestId: '00000000-0000-4000-8000-000000000001',
        },
        { status: 503 },
      ),
    ),
  ];
}
