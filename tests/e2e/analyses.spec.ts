import { expect, test } from '@playwright/test';

import { resumeVersionId } from '../mocks/fixtures/resumes';

test('确认版本后创建分析跳转任务页', async ({ page }) => {
  let posts = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/v1/analyses' && request.method() === 'POST')
      posts++;
  });
  await page.goto('/analyses/new');
  await page.getByLabel('简历版本', { exact: true }).selectOption(resumeVersionId);
  await page.getByLabel('岗位范围', { exact: true }).selectOption('synthetic-corpus-v1');
  await expect(page.getByRole('region', { name: '提交前版本确认' })).toContainText(resumeVersionId);
  await page.getByRole('button', { name: '创建分析任务' }).click();
  await expect(page.getByRole('heading', { name: '任务进度' })).toBeVisible();
  expect(posts).toBe(1);
});
