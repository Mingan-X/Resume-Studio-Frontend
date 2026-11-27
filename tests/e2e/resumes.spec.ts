import { expect, test } from '@playwright/test';

import { resumeId, resumeVersionId } from '../mocks/fixtures/resumes';

test('MSW上传后刷新列表并进入版本详情', async ({ page }) => {
  await page.goto('/resumes?scenario=resume-flow');
  await expect(page.getByText('还没有简历，上传一份PDF或DOCX开始。')).toBeVisible();
  await page.getByLabel('选择简历文件').setInputFiles({
    name: 'synthetic.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('synthetic'),
  });
  await page.getByRole('button', { name: '上传简历', exact: true }).click();
  await expect(page.getByText('上传与文本解析成功。')).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('link', { name: '查看解析文本' }).click();
  await expect(page.getByRole('heading', { name: '简历解析文本' })).toBeVisible();
});

test('简历详情按纯文本显示证据，刷新保持版本', async ({ page }) => {
  await page.goto('/resumes');
  await page.getByRole('link', { name: '查看文本', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`versionId=${resumeVersionId}`));
  await expect(
    page.getByText('<script>danger()</script><img src=x onerror=danger()>', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('article img,article script')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: '简历解析文本' })).toBeVisible();
});
test('缺失或非法versionId不请求详情', async ({ page }) => {
  let calls = 0;
  page.on('request', (r) => {
    if (new URL(r.url()).pathname.includes('/versions/')) calls++;
  });
  await page.goto(`/resumes/${resumeId}?versionId=invalid`);
  await expect(page.getByRole('heading', { name: '404 · 页面不存在' })).toBeVisible();
  expect(calls).toBe(0);
});
