import { expect, test } from '@playwright/test';

test('首页可打开', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Resume Studio');
  await expect(page.getByRole('heading', { name: 'Resume Studio' })).toBeVisible();
  await expect(page.getByText('已连接（ok）')).toBeVisible();
});

test('网络中断显示错误且可重试', async ({ page }) => {
  await page.goto('/?scenario=offline');
  await expect(page.getByRole('alert')).toContainText('网络连接失败');
  await expect(page.getByRole('button', { name: '重新检查' })).toBeEnabled();
});
