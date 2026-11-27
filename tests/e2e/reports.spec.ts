import { expect, test } from '@playwright/test';

import { reportId } from '../mocks/fixtures/reports';
test('报告刷新与重新打开保持快照概要和PARTIAL', async ({ page }) => {
  await page.goto(`/reports/${reportId}`);
  await expect(page.getByRole('status', { name: '部分完成报告' })).toContainText(
    '已评估 3 / 计划 4',
  );
  const content = await page.locator('main').innerText();
  await page.reload();
  await expect(page.locator('main')).toHaveText(content, { useInnerText: true });
  await page.goto('/reports');
  await page.goto(`/reports/${reportId}`);
  await expect(page.locator('main')).toHaveText(content, { useInnerText: true });
});
