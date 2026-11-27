import type { GetReportResponse } from '../../../src/generated/types.gen';
import { jobFixture } from './jobs';
import { resumeFixture } from './resumes';
import { taskId } from './tasks';

export const reportId = '40000000-0000-4000-8000-000000000001';
const hash = 'd'.repeat(64),
  extractionId = '40000000-0000-4000-8000-000000000002';
const dimensions = jobFixture.dimensionWeights.map((entry) => entry.dimension);
const evidence = {
  sourceType: 'RESUME' as const,
  sourceVersionId: resumeFixture.resumeVersionId,
  blockId: '10000000-0000-4000-8000-000000000004',
  start: 0,
  end: 49,
  quote: '<script>danger()</script><img src=x onerror=danger()>',
};
evidence.end = evidence.quote.length;
const jobs = Array.from({ length: 4 }, (_, index) => ({
  ...structuredClone(jobFixture),
  id: `40000000-0000-4000-8000-00000000001${index}`,
  jobId: `40000000-0000-4000-8000-00000000002${index}`,
  title:
    ['推荐合成岗位', '待核实合成岗位', '不符合合成岗位', '未完成合成岗位'][index] ?? '合成岗位',
  status: 'PUBLISHED' as const,
  indexStatus: 'READY' as const,
  publishedAt: jobFixture.createdAt,
  contentHash: hash,
  requirements: jobFixture.requirements.map((item) => ({
    ...item,
    kind: index === 0 ? ('SOFT' as const) : ('HARD' as const),
  })),
}));
const executions: GetReportResponse['content']['executions'] = jobs.map((job, index) =>
  index === 3
    ? {
        jobVersionId: job.id,
        requirementId: 'requirement-1',
        ordinal: index,
        status: 'BUDGET',
        judgment: null,
        errorCode: 'BUDGET_EXHAUSTED',
      }
    : {
        jobVersionId: job.id,
        requirementId: 'requirement-1',
        ordinal: index,
        status: 'DONE',
        errorCode: null,
        judgment: {
          jobVersionId: job.id,
          requirementId: 'requirement-1',
          verdict: index === 0 ? 'met' : index === 1 ? 'unknown' : 'unmet',
          method: 'model',
          evidenceRefs: index === 1 ? [] : [evidence],
          reason:
            index === 1
              ? '无法从现有文本验证硬条件'
              : index === 2
                ? '证据明确不满足该要求'
                : '合成证据支持要求',
        },
      },
);
const results: NonNullable<GetReportResponse['content']['ranking']>['results'] = jobs.map(
  (job, index) => ({
    schemaVersion: 1,
    jobVersionId: job.id,
    policyVersion: 'synthetic-v1',
    policyHash: hash,
    judgmentSetHash: hash,
    weightsSnapshot: {
      dimensionWeights: job.dimensionWeights,
      requirementWeights: [{ requirementId: 'requirement-1', weight: 1 }],
    },
    total: [63.47, 21.37, 12.59, 7.13][index] ?? null,
    coverage: [72.11, 0, 100, 0][index] ?? null,
    upperBound: [91.23, 100, 12.59, 100][index] ?? null,
    sortValue: 63470000,
    planned: 1,
    completed: index === 3 ? 0 : 1,
    incomplete: index === 3 ? 1 : 0,
    unknown: index === 1 ? 1 : 0,
    eligibility: index === 0 ? 'eligible' : index === 2 ? 'ineligible' : 'pending',
    eligibilityReasons:
      index === 0
        ? []
        : index === 1
          ? ['HARD_UNVERIFIED']
          : index === 2
            ? ['HARD_UNMET']
            : ['INCOMPLETE_JUDGMENTS'],
    contributions: executions
      .filter((item) => item.jobVersionId === job.id)
      .map((execution) => ({
        requirementId: 'requirement-1',
        dimension: 'engineering',
        kind: index === 0 ? 'SOFT' : 'HARD',
        execution,
        normalizedWeight: { numerator: '1', denominator: '1' },
        exactContribution: { numerator: '4713', denominator: '100' },
        contribution: 47.13,
      })),
  }),
);
export const reportFixture: GetReportResponse = {
  id: reportId,
  taskId,
  revision: 1,
  rootReportId: reportId,
  sourceReportId: null,
  createdAt: '2026-11-28T00:00:00.000Z',
  content: {
    schemaVersion: 1,
    taskId,
    input: {
      resumeVersionId: resumeFixture.resumeVersionId,
      asOfDate: '2026-11-28',
      jobCorpusVersionId: 'synthetic-corpus-v1',
      rubricVersion: 'synthetic-v1',
      scoringVersion: 'synthetic-v1',
      promptVersion: 'synthetic-v1',
      modelConfigVersion: 'synthetic-v1',
      embeddingVersion: 'synthetic-v1',
    },
    status: 'PARTIAL',
    extractedDocument: resumeFixture.extractedDocument,
    parsedResume: {
      schemaVersion: 1,
      resumeVersionId: resumeFixture.resumeVersionId,
      education: [
        {
          institution: null,
          degree: '合成学位',
          field: null,
          startDate: null,
          endDate: null,
          sourceRefs: [evidence],
        },
      ],
      work: [],
      projects: [],
      skills: [{ name: '合成测试技能', context: null, sourceRefs: [evidence] }],
    },
    extractionId,
    profile: {
      schemaVersion: 1,
      taskId,
      resumeVersionId: resumeFixture.resumeVersionId,
      extractionId,
      rubricVersion: 'synthetic-v1',
      rubricHash: hash,
      inputHash: hash,
      judgments: dimensions.map((dimension, index) => ({
        dimension,
        status: index > 3 ? 'unknown' : 'assessed',
        level: index > 3 ? null : 3,
        featureIds: index > 3 ? [] : ['synthetic-feature'],
        evidenceRefs: index > 3 ? [] : [evidence],
        rubricRefs:
          index > 3
            ? []
            : [
                {
                  rubricVersion: 'synthetic-v1',
                  dimension,
                  level: 3,
                  featureId: 'synthetic-feature',
                },
              ],
        reason: index > 3 ? '证据不足，无法判断' : '合成来源支持当前等级',
      })),
      scores: dimensions.map((dimension, index) => ({
        dimension,
        score: index > 3 ? null : 66.37,
      })),
    },
    candidates: {
      id: '40000000-0000-4000-8000-000000000003',
      contentHash: hash,
      ordered: jobs.map((job, index) => ({
        jobId: job.jobId,
        jobVersionId: job.id,
        rank: index + 1,
        rrfScore: 0.1,
        sources: [{ source: 'keyword', rank: index + 1 }],
      })),
      degraded: false,
      degradationReason: null,
    },
    jobs,
    executions,
    scoreSetId: '40000000-0000-4000-8000-000000000004',
    ranking: {
      schemaVersion: 1,
      results,
      top10: jobs.filter((_, index) => index === 0).map((job) => job.id),
      pending: jobs.filter((_, index) => index === 1 || index === 3).map((job) => job.id),
      ineligible: jobs.filter((_, index) => index === 2).map((job) => job.id),
      shortfall: {
        missing: 9,
        reasons: ['CANDIDATE_COUNT_BELOW_TEN', 'PENDING_CANDIDATES', 'INELIGIBLE_CANDIDATES'],
      },
    },
    candidateCoverage: { planned: 4, completed: 3, incomplete: 1 },
    requirementCoverage: { planned: 4, completed: 3, failed: 0, truncated: 1, pending: 0 },
    warnings: ['INCOMPLETE_REQUIREMENTS'],
    sectionErrors: { profile: null, matching: 'BUDGET_EXHAUSTED' },
  },
};
