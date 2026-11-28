import { expect, it } from 'vitest';

import { csrfHeaders, setCsrf } from './sessionContext';
it('CSRF只作为写请求头保存在内存，非法值拒绝', () => {
  expect(() => setCsrf('bad')).toThrow();
  setCsrf('a'.repeat(64));
  expect(csrfHeaders('GET')).toEqual({});
  expect(csrfHeaders('HEAD')).toEqual({});
  expect(csrfHeaders('POST')).toEqual({ 'X-CSRF-Token': 'a'.repeat(64) });
  setCsrf(undefined);
  expect(csrfHeaders('POST')).toEqual({});
});
