import { expect, test } from '@playwright/test';

test('导入JD、保存草稿及离开未保存页面确认', async ({ page }) => {
  await page.goto('/jobs/new?scenario=job-flow');
  await page.getByLabel('岗位名称', { exact: true }).fill('合成岗位');
  await page.getByLabel('导入职位说明.txt').setInputFiles({
    name: 'synthetic.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('<img onerror=bad()> 合成职位说明'),
  });
  await expect(page.getByLabel('职位说明正文', { exact: true })).toHaveValue(
    '<img onerror=bad()> 合成职位说明',
  );
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('navigation').getByRole('link', { name: '岗位', exact: true }).click();
  await expect(page).toHaveURL(/\/jobs\/new/);
  await page.getByRole('button', { name: '保存草稿', exact: true }).click();
  await expect(page.getByRole('heading', { name: '岗位详情' })).toBeVisible();
  await expect(page.getByLabel('岗位名称', { exact: true })).toHaveValue('合成岗位');
  await expect(page.locator('main img')).toHaveCount(0);
});

test('缺模型仍可手工确认要求，来源按纯文本保存', async ({ page }) => {
  await page.goto('/jobs/30000000-0000-4000-8000-000000000001?scenario=job-flow');
  await page.getByRole('button', { name: '获取抽取建议' }).click();
  await expect(page.getByText('未配置抽取模型，可手工录入要求', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '手工录入要求' }).click();
  await page.getByLabel('要求描述', { exact: true }).fill('合成硬门槛');
  await page.getByLabel('条件类型').selectOption('HARD');
  await page.getByRole('button', { name: '引用整段正文' }).click();
  await page.getByRole('button', { name: '保存这条要求' }).click();
  await expect(page.locator('tbody tr').filter({ hasText: '合成硬门槛' })).toContainText('硬门槛');
  await page.getByLabel('工程能力', { exact: true }).fill('0');
  await page.getByRole('button', { name: '保存维度权重' }).click();
  await expect(page.getByRole('status').filter({ hasText: '维度权重已保存' })).toBeVisible();
});
