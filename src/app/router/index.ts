import { createRouter, createWebHistory } from 'vue-router';

import { installGuards } from './guards';

export function createApplicationRouter() {
  const pages = [
    { path: '/resumes', title: '简历' },
    { path: '/resumes/:resumeId', title: '简历详情' },
    { path: '/jobs', title: '岗位' },
    { path: '/jobs/new', title: '新建岗位' },
    { path: '/jobs/:jobId', title: '岗位详情' },
    { path: '/analyses/new', title: '发起分析' },
    { path: '/tasks/:taskId', title: '任务进度' },
    { path: '/reports', title: '报告历史' },
    { path: '/reports/:reportId', title: '报告详情' },
    { path: '/login', title: '登录' },
  ];
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', redirect: '/resumes' },
      ...pages.map(({ path, title }) => ({
        path,
        component: () => import('@/pages/DevelopmentPage.vue'),
        meta: { title },
      })),
      {
        name: 'not-found',
        path: '/:pathMatch(.*)*',
        component: () => import('@/pages/NotFoundPage.vue'),
        meta: { title: '页面不存在' },
      },
    ],
  });
  installGuards(router);
  return router;
}
