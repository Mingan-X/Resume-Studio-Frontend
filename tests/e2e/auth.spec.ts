import { expect, test } from '@playwright/test';
test('未登录跳登录，登录后返回原页面，登出移除内容', async ({ page }) => {
  await page.goto('/reports?scenario=auth-flow');
  await expect(page).toHaveURL(/\/login\?redirect=/);
  await page.getByLabel('账号', { exact: true }).fill('synthetic-user');
  await page.getByLabel('口令', { exact: true }).fill('synthetic-password-long');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page).toHaveURL(/\/reports\?scenario=auth-flow$/);
  await expect(page.getByRole('heading', { name: '报告历史', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: '退出登录' }).click();
  await expect(page.getByRole('heading', { name: '登录 Resume Studio' })).toBeVisible();
});
