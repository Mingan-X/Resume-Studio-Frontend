import { expect, it } from 'vitest';

import { reportFixture } from '../../../../tests/mocks/fixtures/reports';
import { radarGeometry } from './radar';
it('unknown无点且不连接跨越缺证据轴，明确零分仍是有效点', () => {
  const profile = structuredClone(reportFixture.content.profile);
  if (!profile) throw new Error('fixture missing');
  const geometry = radarGeometry(profile, 500, 400);
  expect(geometry.points).toHaveLength(4);
  expect(geometry.edges).toHaveLength(3);
  expect(geometry.points.map((item) => item.score)).toEqual([66.37, 66.37, 66.37, 66.37]);
  const score = profile.scores[0];
  if (score) score.score = 0;
  expect(radarGeometry(profile, 500, 400).points[0]).toMatchObject({ score: 0, x: 250, y: 200 });
});
