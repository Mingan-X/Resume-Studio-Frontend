import path from 'node:path';
import { expect, test } from '@playwright/test';
import { z } from 'zod';

for (const name of ['valid.pdf', 'valid.docx']) {
  test(`真实${name}上传、列表、详情和刷新`, async ({ page }) => {
    const root = z.string().min(1).parse(process.env.RESUME_SMOKE_ROOT);
    await page.goto('/resumes');
    await page.getByLabel('选择简历文件').setInputFiles(path.join(root, name));
    await page.getByRole('button', { name: '上传简历', exact: true }).click();
    await expect(page.getByText('上传与文本解析成功。')).toBeVisible({ timeout: 20000 });
    await page.getByRole('link', { name: '查看解析文本' }).click();
    await expect(page.getByRole('heading', { name: '简历解析文本' })).toBeVisible();
    await expect(page.locator('article').first()).toContainText('合成简历');
    await page.reload();
    await expect(page.locator('article').first()).toContainText('合成简历');
  });
}
for (const [name, reason] of [
  ['scanned.pdf', '不支持扫描PDF'],
  ['encrypted.pdf', '不支持加密文件'],
] as const) {
  test(`真实${name}显示拒绝原因且不新增简历`, async ({ page }) => {
    const root = z.string().min(1).parse(process.env.RESUME_SMOKE_ROOT);
    await page.goto('/resumes');
    await expect(page.locator('tbody tr')).toHaveCount(2);
    await page.getByLabel('选择简历文件').setInputFiles(path.join(root, name));
    await page.getByRole('button', { name: '上传简历', exact: true }).click();
    await expect(page.getByText(reason, { exact: false })).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('button', { name: '复制请求编号' })).toBeVisible();
    await page.reload();
    await expect(page.locator('tbody tr')).toHaveCount(2);
  });
}
