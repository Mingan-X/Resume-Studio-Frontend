import type { GetAnalysisOptionsResponse } from '../../../src/generated/types.gen';
import { resumeFixture } from './resumes';

export const analysisOptionsFixture: GetAnalysisOptionsResponse = {
  resumes: [
    {
      resumeId: resumeFixture.resumeId,
      resumeVersionId: resumeFixture.resumeVersionId,
      version: 1,
      createdAt: resumeFixture.createdAt,
      fileHash: resumeFixture.file.sha256,
    },
  ],
  corpora: [
    {
      version: 'synthetic-corpus-v1',
      createdAt: '2026-11-28T00:00:00.000Z',
      contentHash: 'c'.repeat(64),
      jobCount: 2,
    },
  ],
  configuration: {
    configurationVersion: 'synthetic-v1',
    rubricVersion: 'synthetic-v1',
    scoringVersion: 'synthetic-v1',
    promptVersion: 'synthetic-v1',
    modelConfigVersion: 'synthetic-v1',
    embeddingVersion: 'synthetic-v1',
  },
  nextResumeCursor: null,
  nextCorpusCursor: null,
};
