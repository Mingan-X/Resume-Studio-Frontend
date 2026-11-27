import { expect, test } from '@playwright/test';

test('真实JD新建、手工确认、发布与索引任务可查询', async ({ page }) => {
  await page.goto('/jobs/new');
  await page.getByLabel('岗位名称', { exact: true }).fill('合成工程岗位');
  await page.getByLabel('职位说明正文', { exact: true }).fill('负责工程测试与交付。');
  await page.getByRole('button', { name: '保存草稿', exact: true }).click();
  await expect(page.getByRole('heading', { name: '岗位详情' })).toBeVisible();
  await page.getByRole('button', { name: '获取抽取建议' }).click();
  await expect(
    page.getByText('抽取模型当前不可用，可以手工录入要求。', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('请求无法处理');
  await page.getByRole('button', { name: '手工录入要求' }).click();
  await page.getByLabel('要求描述', { exact: true }).fill('工程测试与交付');
  await page.getByRole('button', { name: '引用整段正文' }).click();
  await page.getByRole('button', { name: '保存这条要求' }).click();
  await expect(page.getByText('要求已保存，请核对后确认发布。', { exact: true })).toBeVisible();
  await page.getByLabel('已逐条核对硬门槛与来源').check();
  await page.getByLabel('已核对要求权重与六维权重').check();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: '确认并发布' }).click();
  await expect(page.getByRole('link', { name: '查看索引任务' })).toBeVisible();
  await page.getByRole('link', { name: '查看索引任务' }).click();
  await expect(page.getByText('等待处理', { exact: true }).first()).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: '岗位', exact: true }).click();
  await expect(page.locator('tbody tr').filter({ hasText: '合成工程岗位' })).toContainText(
    '已发布',
  );
  await expect(page.locator('tbody tr')).toContainText('待索引');
  await expect(page.locator('tbody tr')).toContainText('未参与召回');
});
