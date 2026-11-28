import { QueryClient } from '@tanstack/vue-query';
import { createPinia } from 'pinia';
import { expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import { useSessionStore } from '@/features/auth';
import { AppError } from '@/shared/api/errors';
import { notifyAuthFailure } from '@/shared/api/sessionContext';

import { accessError, installAuthFailureHandling } from './auth';
it('401清空缓存并保留站内返回地址，403保留安全requestId', async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/reports', component: {} },
      { path: '/login', component: {} },
    ],
  });
  await router.push('/reports');
  const client = new QueryClient(),
    store = useSessionStore(createPinia());
  client.setQueryData(['private'], { synthetic: 'report' });
  const cleanup = installAuthFailureHandling(router, client, store);
  notifyAuthFailure(
    new AppError({
      kind: 'http',
      code: 'FORBIDDEN',
      message: '原文',
      status: 403,
      requestId: '00000000-0000-4000-8000-000000000001',
      retryable: false,
    }),
    '/reports',
  );
  expect(accessError.value?.message).toContain('无权');
  expect(accessError.value?.requestId).toBe('00000000-0000-4000-8000-000000000001');
  notifyAuthFailure(
    new AppError({
      kind: 'http',
      code: 'UNAUTHENTICATED',
      message: '失效',
      status: 401,
      retryable: false,
    }),
    '/reports',
  );
  await expect.poll(() => router.currentRoute.value.path).toBe('/login');
  expect(router.currentRoute.value.query.redirect).toBe('/reports');
  expect(client.getQueryData(['private'])).toBeUndefined();
  cleanup();
  accessError.value = null;
});
