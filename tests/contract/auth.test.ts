import { expect, it } from 'vitest';

import { zGetAuthSessionResponse, zLoginBody } from '../../src/generated/zod.gen';
import { sessionFixture } from '../mocks/authHandlers';
it('会话夹具按生成契约校验，登录字段拒绝过短口令', () => {
  expect(zGetAuthSessionResponse.parse(sessionFixture)).toEqual(sessionFixture);
  expect(zLoginBody.safeParse({ username: 'synthetic-user', password: 'short' }).success).toBe(
    false,
  );
});
