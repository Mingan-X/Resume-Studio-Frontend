import { createPinia, setActivePinia } from 'pinia';
import { expect, it } from 'vitest';

import { useSessionStore } from './session';
it('客户端当前用户状态可清除且没有令牌字段', () => {
  setActivePinia(createPinia());
  const store = useSessionStore();
  store.user = { id: '50000000-0000-4000-8000-000000000001', username: 'synthetic-user' };
  store.ready = true;
  store.clear();
  expect(store.user).toBeNull();
  expect(store.ready).toBe(false);
  expect(Object.keys(store.$state)).not.toContain('token');
});
