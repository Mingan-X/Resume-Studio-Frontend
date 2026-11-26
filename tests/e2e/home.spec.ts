import { expect, test } from '@playwright/test';

test('首页可打开', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Resume Studio');
  await expect(page.getByRole('heading', { name: 'Resume Studio' })).toBeVisible();
});
