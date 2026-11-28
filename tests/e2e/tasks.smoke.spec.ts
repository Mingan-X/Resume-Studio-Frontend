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

test('真实持久SSE可按Last-Event-ID补读，终态读完返回204', async ({ request }) => {
  const taskId = z.uuid().parse(process.env.SMOKE_SUCCEEDED_TASK_ID);
  const first = await request.get(`/api/v1/tasks/${taskId}/events`);
  expect(first.status()).toBe(200);
  expect(first.headers()['content-type']).toContain('text/event-stream');
  const content = await first.text();
  expect(content).toContain('event: task');
  const ids = [...content.matchAll(/^id: (\d+)$/gm)].map((match) =>
    z.coerce.number().int().positive().parse(match[1]),
  );
  expect(ids.length).toBeGreaterThan(0);
  const last = ids.at(-1);
  if (!last) throw new Error('missing event id');
  const resumed = await request.get(`/api/v1/tasks/${taskId}/events`, {
    headers: { 'Last-Event-ID': String(last) },
  });
  expect(resumed.status()).toBe(204);
});

test('真实取消请求持久化，安全边界终态由后端提交', async ({ page, request }) => {
  const taskId = z.uuid().parse(process.env.SMOKE_QUEUED_TASK_ID);
  await page.goto(`/tasks/${taskId}`);
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: '取消任务', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: '取消请求已提交' })).toBeVisible();
  const response = await request.get(`/api/v1/tasks/${taskId}`);
  expect(await response.json()).toMatchObject({ cancelRequested: true, status: 'QUEUED' });
  // runner结束时调用后端真实对账服务，并核对最终CANCELLED，然后精确清理。
});
