import { expect, test } from '@playwright/test';
import { z } from 'zod';

test('真实后端合成任务终态和计数可查询', async ({ page }) => {
  const taskId = z.uuid().parse(process.env.SMOKE_SUCCEEDED_TASK_ID);
  await page.goto(`/tasks/${taskId}`);
  await expect(page.getByText('合成任务完成', { exact: true })).toBeVisible();
  await expect(page.getByText('1 / 1', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '查看报告' })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('合成任务完成', { exact: true })).toBeVisible();
});
