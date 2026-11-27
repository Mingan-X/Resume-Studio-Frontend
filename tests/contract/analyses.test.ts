import { expect, it } from 'vitest';

import { zCreateAnalysisBody, zGetAnalysisOptionsResponse } from '../../src/generated/zod.gen';
import { analysisOptionsFixture } from '../mocks/fixtures/analyses';

it('分析选项夹具与后端契约一致，corpus为版本名而非UUID', () => {
  expect(zGetAnalysisOptionsResponse.parse(analysisOptionsFixture)).toEqual(analysisOptionsFixture);
  expect(
    zCreateAnalysisBody.safeParse({
      resumeVersionId: 'bad',
      asOfDate: 'today',
      jobCorpusVersionId: 'invalid space',
    }).success,
  ).toBe(false);
});
