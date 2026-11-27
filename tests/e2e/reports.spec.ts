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
