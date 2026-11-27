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
