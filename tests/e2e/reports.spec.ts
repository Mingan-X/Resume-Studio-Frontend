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

test('报告展示规则：原始分数、缺证据、PARTIAL、不补推荐、资格分区与安全证据', async ({ page }) => {
  await page.goto(`/reports/${reportId}`);
  const recommendations = page.getByRole('region', { name: '推荐岗位' }),
    pending = page.getByRole('region', { name: '待核实岗位' });
  await expect(recommendations.locator('.recommendation')).toHaveCount(1);
  await expect(recommendations).toContainText('63.47分 · 覆盖率72.11% · 上界91.23');
  await expect(recommendations).toContainText('候选岗位不足10个');
  await expect(recommendations).not.toContainText('待核实合成岗位');
  await expect(page.getByRole('region', { name: '六维画像' })).toContainText(
    '证据不足：协作沟通、成长性',
  );
  await expect(page.getByRole('region', { name: '六维画像' })).toContainText('—（证据不足）');
  await expect(page.getByRole('img', { name: /六维画像图/ }).locator('svg')).toBeVisible();
  await expect(page.getByRole('status', { name: '部分完成报告' })).toContainText(
    '排名仅基于已评估岗位',
  );
  await expect(pending).toContainText('待核实合成岗位');
  await expect(pending).not.toContainText('21.37');
  await pending.getByText('逐项判断、贡献与证据', { exact: true }).first().click();
  await expect(pending.locator('.verdict-unknown')).toContainText('证据不足');
  await page.getByText('展开不符合硬条件的岗位', { exact: true }).click();
  const ineligible = page.getByRole('region', { name: '不符合硬条件' });
  await ineligible.getByText('逐项判断、贡献与证据', { exact: true }).click();
  await expect(ineligible.locator('.verdict-unmet')).toContainText('不满足');
  await ineligible.getByText('展开来源证据', { exact: true }).click();
  await expect(ineligible).toContainText('<script>danger()</script>');
  await expect(page.locator('main img,main script')).toHaveCount(0);
});

test('报告证据可展开并跳转版本锚点', async ({ page }) => {
  await page.goto(`/reports/${reportId}`);
  await page.getByText('展开来源证据', { exact: true }).first().click();
  await page.getByRole('button', { name: '查找原简历详情' }).first().click();
  await page.getByRole('link', { name: '打开简历来源位置' }).first().click();
  await expect(page).toHaveURL(/\/resumes\/.+\?versionId=.+#block-/);
  const blockId = new URL(page.url()).hash.slice(1);
  await expect(page.locator(`article[id="${blockId}"]`)).toContainText('<script>danger()</script>');
  await expect(page.locator(`article[id="${blockId}"]`)).toHaveClass(/is-source-target/);
  await expect(page.locator(`article[id="${blockId}"]`)).toBeFocused();
});
