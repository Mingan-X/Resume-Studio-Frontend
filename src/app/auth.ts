import type { QueryClient } from '@tanstack/vue-query';
import { shallowRef } from 'vue';
import type { Router } from 'vue-router';

import type { useSessionStore } from '@/features/auth';
import { AppError } from '@/shared/api/errors';
import { onAuthFailure, setCsrf } from '@/shared/api/sessionContext';

export const accessError = shallowRef<AppError | null>(null);
export function installAuthFailureHandling(
  router: Router,
  client: QueryClient,
  session: ReturnType<typeof useSessionStore>,
) {
  let redirecting = false;
  router.afterEach(() => {
    accessError.value = null;
  });
  return onAuthFailure((error) => {
    if (error.status === 403) {
      accessError.value = new AppError({
        kind: 'http',
        code: 'FORBIDDEN',
        message: '无权执行此操作，请重新登录后重试。',
        retryable: false,
        status: 403,
        requestId: error.requestId,
      });
      return;
    }
    if (redirecting || router.currentRoute.value.path === '/login') return;
    redirecting = true;
    const redirect = router.currentRoute.value.fullPath;
    void client
      .cancelQueries()
      .then(async () => {
        client.clear();
        setCsrf(undefined);
        session.clear();
        await router.replace({ path: '/login', query: { redirect } });
      })
      .finally(() => {
        redirecting = false;
      });
  });
}
