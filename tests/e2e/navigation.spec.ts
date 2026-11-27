import { expect, test } from '@playwright/test';

test('占位页不请求业务数据，导航支持键盘', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api/')) requests.push(request.url());
  });
  await page.goto('/reports');
  const jobs = page.getByRole('navigation').getByRole('link', { name: '发起分析', exact: true });
  await jobs.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/analyses\/new$/);
  await expect(page.getByText('功能开发中')).toBeVisible();
  expect(requests).toEqual([]);
});

test('未知路径及非法ID显示404且不请求接口', async ({ page }) => {
  const calls: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api/')) calls.push(request.url());
  });
  for (const path of [
    '/does-not-exist',
    '/resumes/not-a-uuid',
    '/tasks/not-a-uuid',
    '/jobs/not-a-uuid',
    '/reports/not-a-uuid',
  ]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: '404 · 页面不存在' })).toBeVisible();
  }
  expect(calls).toEqual([]);
});

test('登录返回地址只接受站内路径', async ({ page }) => {
  await page.goto('/login?redirect=https://external.test');
  await expect(page).toHaveURL(/redirect=\/resumes$/);
  await expect(page.getByText('功能开发中')).toBeVisible();
});
