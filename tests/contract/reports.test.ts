import { expect, it } from 'vitest';

import { zGetReportResponse } from '../../src/generated/zod.gen';
import { reportFixture } from '../mocks/fixtures/reports';

it('报告夹具包含PARTIAL/unknown/待核实/不符合/HTML和非重算分数且通过生成Schema', () => {
  expect(zGetReportResponse.parse(reportFixture)).toEqual(reportFixture);
  expect(reportFixture.content.ranking?.results[0]?.total).toBe(63.47);
  expect(reportFixture.content.profile?.scores.at(-1)?.score).toBeNull();
});
