import type { Router } from 'vue-router';

import { routeIdSchema, safeRedirect } from '@/shared/lib/routeInput';

export function installGuards(router: Router) {
  router.beforeEach((to) => {
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
    // F3.1接入会话前只校验输入，开发期身份守卫放行。
    return true;
  });
}
