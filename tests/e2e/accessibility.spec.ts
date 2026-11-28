import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const [path, heading] of [
  ['/login', '登录 Resume Studio'],
  ['/resumes', '简历'],
  [
    '/resumes/10000000-0000-4000-8000-000000000001?versionId=10000000-0000-4000-8000-000000000002',
    '简历解析文本',
  ],
  ['/jobs', '岗位'],
  ['/jobs/new', '新建岗位'],
  ['/jobs/30000000-0000-4000-8000-000000000001', '岗位详情'],
  ['/analyses/new', '发起分析'],
  ['/tasks/00000000-0000-4000-8000-000000000002', '任务进度'],
  ['/reports', '报告历史'],
  ['/reports/40000000-0000-4000-8000-000000000001', '分析报告'],
] as const) {
  test(`WCAG自动检查 ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading, exact: true, level: 1 })).toBeVisible();
    if (path.startsWith('/reports/'))
      await expect(page.getByRole('region', { name: '六维画像' })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      results.violations.map((item) => ({
        id: item.id,
        impact: item.impact,
        nodes: item.nodes.map((node) => node.target),
      })),
    ).toEqual([]);
  });
}
test('键盘跳过导航可见焦点，768宽内容可用', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/reports/40000000-0000-4000-8000-000000000001');
  await expect(page.getByRole('heading', { name: '分析报告' })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '跳到内容' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
