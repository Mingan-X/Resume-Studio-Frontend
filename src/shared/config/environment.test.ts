import { expect, it } from 'vitest';

import { environmentSchema } from './environment';

it('校验公开构建配置并为缺省配置赋值', () => {
  expect(environmentSchema.parse({})).toEqual({
    VITE_APP_TITLE: 'Resume Studio',
    VITE_ENABLE_MOCKS: 'false',
  });
  expect(environmentSchema.safeParse({ VITE_ENABLE_MOCKS: 'yes' }).success).toBe(false);
});
