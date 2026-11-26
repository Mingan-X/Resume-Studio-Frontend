import { expect, test } from '@playwright/test';

import { taskId } from '../mocks/fixtures/tasks';

test('任务从真实计数进入终态后不继续轮询', async ({ page }) => {
  let reads = 0;
  page.on('request', (r) => {
    if (new URL(r.url()).pathname === `/api/v1/tasks/${taskId}`) reads++;
  });
  await page.goto(`/tasks/${taskId}?scenario=task-progress`);
  await expect(page.getByText('处理中', { exact: true })).toBeVisible();
  await expect(page.getByText('已完成', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('合成任务完成', { exact: true })).toBeVisible();
  const finalReads = reads;
  await page.waitForTimeout(2200);
  expect(reads).toBe(finalReads);
  await expect(page.getByRole('link', { name: '查看报告' })).toHaveCount(0);
});
test('刷新后按接口恢复重试状态', async ({ page }) => {
  await page.goto(`/tasks/${taskId}?scenario=task-retry`);
  await expect(page.getByText('等待重试', { exact: true })).toBeVisible();
  await expect(page.locator('time')).toHaveAttribute('datetime', '2026-11-27T00:00:00.000Z');
  await page.reload();
  await expect(page.getByText('等待重试', { exact: true })).toBeVisible();
});
