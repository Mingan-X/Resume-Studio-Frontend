import { expect, test } from '@playwright/test';

test('真实选项和分析创建进入QUEUED，未启动模型', async ({ page }) => {
  await page.goto('/analyses/new');
  await expect(page.getByLabel('简历版本', { exact: true }).locator('option')).toHaveCount(2);
  await page.getByLabel('简历版本', { exact: true }).selectOption({ index: 1 });
  await page.getByLabel('岗位范围', { exact: true }).selectOption('test-corpus-v1');
  await expect(page.getByRole('region', { name: '提交前版本确认' })).toContainText(
    'test-corpus-v1',
  );
  await page.getByRole('button', { name: '创建分析任务' }).click();
  await expect(page.getByRole('heading', { name: '任务进度' })).toBeVisible();
  await expect(page.getByText('等待处理', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: '查看报告' })).toHaveCount(0);
});
