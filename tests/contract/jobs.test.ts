import { expect, it } from 'vitest';

import { jobSchema, jobsSchema } from '../../src/features/jobs/model/contracts';
import { zGetJobResponse, zListJobsResponse } from '../../src/generated/zod.gen';
import { jobFixture, jobsFixture } from '../mocks/fixtures/jobs';

it('岗位夹具由生成契约校验，展示层容忍新增状态枚举', () => {
  expect(zGetJobResponse.parse(jobFixture)).toEqual(jobFixture);
  expect(zListJobsResponse.parse(jobsFixture)).toEqual(jobsFixture);
  expect(jobSchema.parse({ ...jobFixture, indexStatus: 'INDEXING' }).indexStatus).toBe('INDEXING');
  expect(
    jobsSchema.parse({
      ...jobsFixture,
      items: [{ ...jobsFixture.items[0], latestVersion: { ...jobFixture, status: 'FUTURE' } }],
    }).items[0]?.latestVersion.status,
  ).toBe('FUTURE');
  expect(jobSchema.safeParse({ ...jobFixture, requirements: [{ weight: -1 }] }).success).toBe(
    false,
  );
});
