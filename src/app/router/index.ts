import { createRouter, createWebHistory } from 'vue-router';

import { installGuards } from './guards';

export function createApplicationRouter() {
  const pages = [
    { path: '/reports', title: '报告历史' },
    { path: '/reports/:reportId', title: '报告详情' },
    { path: '/login', title: '登录' },
  ];
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', redirect: '/resumes' },
      {
        path: '/analyses/new',
        component: () => import('@/pages/AnalysisNewPage.vue'),
        meta: { title: '发起分析' },
      },
      {
        path: '/jobs/new',
        component: () => import('@/pages/JobNewPage.vue'),
        meta: { title: '新建岗位' },
      },
      {
        path: '/jobs/:jobId',
        component: () => import('@/pages/JobDetailPage.vue'),
        meta: { title: '岗位详情' },
      },
      { path: '/jobs', component: () => import('@/pages/JobsPage.vue'), meta: { title: '岗位' } },
      {
        path: '/resumes/:resumeId',
        component: () => import('@/pages/ResumeDetailPage.vue'),
        meta: { title: '简历解析文本' },
      },
      {
        path: '/resumes',
        component: () => import('@/pages/ResumesPage.vue'),
        meta: { title: '简历' },
      },
      {
        path: '/tasks/:taskId',
        component: () => import('@/pages/TaskPage.vue'),
        meta: { title: '任务进度' },
      },
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
