import { expect, test } from '@playwright/test';

test('占位页不请求业务数据，导航支持键盘', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api/')) requests.push(request.url());
  });
  await page.goto('/');
  const jobs = page.getByRole('navigation').getByRole('link', { name: '岗位', exact: true });
  await jobs.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/jobs$/);
  await expect(page.getByText('功能开发中')).toBeVisible();
  expect(requests).toEqual([]);
});
