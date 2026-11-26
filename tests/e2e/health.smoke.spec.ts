import { expect, test } from '@playwright/test';

test('Vite代理真实后端健康接口', async ({ page, request }) => {
  const response = await request.get('/health');
  expect(response.ok()).toBe(true);
  const body: unknown = await response.json();
  expect(body).toMatchObject({ status: 'ok', service: 'api', environment: 'development' });
  await page.goto('/');
  await page.getByRole('button', { name: '检查服务连接' }).click();
  await expect(page.getByText('已连接（ok）')).toBeVisible();
  await expect(page.getByText('development', { exact: true })).toBeVisible();
});
