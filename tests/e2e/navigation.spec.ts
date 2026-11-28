import { expect, test } from '@playwright/test';

test('导航支持键盘进入报告历史', async ({ page }) => {
  await page.goto('/login');
  const jobs = page.getByRole('navigation').getByRole('link', { name: '报告历史', exact: true });
  await jobs.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/reports$/);
  await expect(
    page.getByRole('heading', { name: '报告历史', exact: true, level: 1 }),
  ).toBeVisible();
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
  await expect(page.getByRole('heading', { name: '登录 Resume Studio' })).toBeVisible();
});
