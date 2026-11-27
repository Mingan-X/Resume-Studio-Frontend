import { expect, test } from '@playwright/test';

test('真实报告不存在时不泄露资源并保留请求编号', async ({ page }) => {
  await page.goto('/reports/40000000-0000-4000-8000-999999999999');
  await expect(page.getByRole('alert')).toContainText('不存在或无权访问');
  await expect(page.getByRole('button', { name: '复制请求编号' })).toBeVisible();
});
