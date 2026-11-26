import { describe, expect, it } from 'vitest';

import { routeIdSchema, safeRedirect } from './routeInput';

describe('路由外部输入', () => {
  it('UUID为不透明值，拒绝数组与非法字符', () => {
    expect(routeIdSchema.safeParse('00000000-0000-4000-8000-000000000001').success).toBe(true);
    for (const value of ['abc', '../jobs', ['00000000-0000-4000-8000-000000000001'], null])
      expect(routeIdSchema.safeParse(value).success).toBe(false);
  });
  it.each([
    'https://external.test',
    '//external.test',
    '/\\external.test',
    '/%2fexternal.test',
    '/%255cexternal.test',
    '/\nexternal.test',
    'javascript:alert(1)',
    null,
    ['/jobs'],
  ])('拒绝危险返回地址%j', (value) => {
    expect(safeRedirect(value)).toBe('/resumes');
  });
  it('保留合法站内路径、查询与锚点', () => {
    expect(safeRedirect('/reports?cursor=abc#history')).toBe('/reports?cursor=abc#history');
  });
});
