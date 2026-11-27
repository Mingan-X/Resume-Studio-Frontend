import { expect, it } from 'vitest';

import { zGetResumeVersionResponse, zListResumesResponse } from '../../src/generated/zod.gen';
import { resumeFixture, resumeListFixture } from '../mocks/fixtures/resumes';

it('简历夹具通过后端生成Schema且拒绝损坏的证据位置', () => {
  expect(zGetResumeVersionResponse.parse(resumeFixture)).toEqual(resumeFixture);
  expect(zListResumesResponse.parse(resumeListFixture)).toEqual(resumeListFixture);
  expect(zGetResumeVersionResponse.safeParse({ ...resumeFixture, version: 0 }).success).toBe(false);
});
