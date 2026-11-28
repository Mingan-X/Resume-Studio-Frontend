import type { QueryClient } from '@tanstack/vue-query';
import type { Pinia } from 'pinia';
import type { Router } from 'vue-router';

import { loadSession, useSessionStore } from '@/features/auth';
import { routeIdSchema, safeRedirect } from '@/shared/lib/routeInput';

export function installGuards(router: Router, client: QueryClient, pinia: Pinia) {
  router.beforeEach(async (to) => {
    if (to.name === 'not-found') return true;
    for (const key of ['resumeId', 'jobId', 'taskId', 'reportId']) {
      if (key in to.params && !routeIdSchema.safeParse(to.params[key]).success) {
        return {
          name: 'not-found',
          params: { pathMatch: to.path.slice(1).split('/') },
          replace: true,
        };
      }
    }
    if (to.query.redirect !== undefined && safeRedirect(to.query.redirect) !== to.query.redirect) {
      return {
        path: to.path,
        query: { ...to.query, redirect: '/resumes' },
        hash: to.hash,
        replace: true,
      };
    }
    if (to.path === '/login') return true;
    const session = useSessionStore(pinia);
    try {
      await loadSession(client, session);
      if (!session.user && !session.development)
        return { path: '/login', query: { redirect: to.fullPath } };
    } catch {
      return { path: '/login', query: { redirect: to.fullPath } };
    }
    return true;
  });
}
