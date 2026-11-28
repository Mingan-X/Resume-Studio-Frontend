import path from 'node:path';
import { expect, test } from '@playwright/test';
import { z } from 'zod';

test('真实HTTPS匿名→登录→原页面→CSRF写请求→退出', async ({ page }) => {
  const username = z.string().min(1).parse(process.env.AUTH_SMOKE_USER);
  await page.goto('/jobs/new');
  await expect(page).toHaveURL(/\/login\?redirect=/);
  await page.getByLabel('账号', { exact: true }).fill(username);
  await page.getByLabel('口令', { exact: true }).fill('synthetic-password-long-123');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page).toHaveURL('https://localhost:4443/jobs/new');
  await expect(page.getByRole('heading', { name: '新建岗位', exact: true })).toBeVisible();
  const missingStatus = await page.evaluate(
    async () =>
      (
        await fetch('/api/v1/jobs', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        })
      ).status,
  );
  expect(missingStatus).toBe(403);
  await page.getByLabel('岗位名称', { exact: true }).fill('合成认证岗位');
  await page.getByLabel('职位说明正文', { exact: true }).fill('负责工程测试与交付。');
  await page.getByRole('button', { name: '保存草稿', exact: true }).click();
  await expect(page.getByRole('heading', { name: '岗位详情' })).toBeVisible();
  await page.getByRole('button', { name: '退出登录' }).click();
  await expect(page.getByRole('heading', { name: '登录 Resume Studio' })).toBeVisible();
  await page.goto('/reports');
  await expect(page).toHaveURL(/\/login\?redirect=/);
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: Object.keys(sessionStorage).filter((key) => key !== 'vue-router:scroll').length,
      cookie: document.cookie.includes('__Host-resume_session'),
    })),
  ).toEqual({ local: 0, session: 0, cookie: false });
});

test('真实HTTPS岗位要求确认发布并查看持久索引任务', async ({ page }) => {
  await page.goto('/jobs');
  await page
    .getByLabel('账号', { exact: true })
    .fill(z.string().parse(process.env.AUTH_SMOKE_USER));
  await page.getByLabel('口令', { exact: true }).fill('synthetic-password-long-123');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await page.getByRole('link', { name: '合成认证岗位', exact: true }).click();
  await page.getByRole('button', { name: '手工录入要求' }).click();
  await page.getByLabel('要求描述', { exact: true }).fill('工程测试与交付');
  await page.getByRole('button', { name: '引用整段正文' }).click();
  await page.getByRole('button', { name: '保存这条要求' }).click();
  await expect(page.getByText('要求已保存，请核对后确认发布。', { exact: true })).toBeVisible();
  await page.getByLabel('已逐条核对硬门槛与来源').check();
  await page.getByLabel('已核对要求权重与六维权重').check();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: '确认并发布' }).click();
  await page.getByRole('link', { name: '查看索引任务' }).click();
  await expect(page.getByRole('heading', { name: '任务进度' })).toBeVisible();
  await expect(page.getByText('等待处理', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: '退出登录' }).click();
});
test('真实HTTPS上传使用同一会话及XHR CSRF', async ({ page }) => {
  const username = z.string().parse(process.env.AUTH_SMOKE_USER),
    root = z.string().parse(process.env.AUTH_SMOKE_ROOT);
  await page.goto('/resumes');
  await page.getByLabel('账号', { exact: true }).fill(username);
  await page.getByLabel('口令', { exact: true }).fill('synthetic-password-long-123');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page.getByRole('heading', { name: '简历', exact: true })).toBeVisible();
  await page.getByLabel('选择简历文件').setInputFiles(path.join(root, 'synthetic.pdf'));
  await page.getByRole('button', { name: '上传简历', exact: true }).click();
  await expect(page.getByText('上传与文本解析成功。')).toBeVisible({ timeout: 20000 });
  await page.getByRole('button', { name: '退出登录' }).click();
});
