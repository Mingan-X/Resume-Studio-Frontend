import { expect, test } from '@playwright/test';

import { sessionFixture } from '../mocks/authHandlers';
import { analysisOptionsFixture } from '../mocks/fixtures/analyses';
import { jobFixture, jobsFixture } from '../mocks/fixtures/jobs';
import { reportFixture } from '../mocks/fixtures/reports';
import { resumeListFixture } from '../mocks/fixtures/resumes';
import { queuedTask } from '../mocks/fixtures/tasks';

test('nginx生产产物响应头、缓存、SPA深链及真实API404', async ({ page, request }) => {
  await page.route('**/api/v1/auth/session', (route) => route.fulfill({ json: sessionFixture }));
  await page.route('**/api/v1/reports/*', (route) => route.fulfill({ json: reportFixture }));
  await page.route('**/api/v1/reports/*/revisions*', (route) =>
    route.fulfill({ json: { items: [], nextCursor: null } }),
  );
  const violations: string[] = [];
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      console.warn(
        'CSP_TEST:' +
          JSON.stringify({
            directive: event.violatedDirective,
            source: event.sourceFile,
            line: event.lineNumber,
            column: event.columnNumber,
            blocked: event.blockedURI,
          }),
      );
    });
  });
  page.on('console', (message) => {
    if (message.text().startsWith('CSP_TEST:')) violations.push(message.text());
  });
  const response = await page.goto(`/reports/${reportFixture.id}`);
  expect(response?.headers()['content-security-policy']).toContain("style-src-elem 'self'");
  expect(response?.headers()['content-security-policy']).not.toContain(
    "script-src 'unsafe-inline'",
  );
  expect(response?.headers()['x-content-type-options']).toBe('nosniff');
  expect(response?.headers()['permissions-policy']).toContain('camera=()');
  expect(response?.headers()['cache-control']).toBe('no-cache');
  await expect(page.getByRole('heading', { name: '分析报告' })).toBeVisible();
  await expect(page.getByRole('img', { name: /六维画像图/ }).locator('svg')).toBeVisible();
  expect(violations).toEqual([]);
  const script = await page.locator('script[src]').first().getAttribute('src');
  if (!script) throw new Error('missing asset');
  const asset = await request.get(script);
  expect(asset.headers()['cache-control']).toContain('immutable');
  const missing = await request.get('/api/v1/does-not-exist');
  expect(missing.status()).toBe(404);
  expect(missing.headers()['content-type']).toContain('application/json');
  expect(await missing.text()).not.toContain('<!doctype html>');
  expect((await request.get('/assets/missing.js')).status()).toBe(404);
  expect((await request.get('/ready')).status()).toBe(404);
});
test('尝试禁用样式属性并记录实际CSP限制', async ({ page }, testInfo) => {
  await page.route('**/api/v1/auth/session', (route) => route.fulfill({ json: sessionFixture }));
  await page.route('**/api/v1/reports/*', (route) => route.fulfill({ json: reportFixture }));
  await page.route('**/api/v1/reports/*/revisions*', (route) =>
    route.fulfill({ json: { items: [], nextCursor: null } }),
  );
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      console.warn(
        'CSP_TEST:' +
          JSON.stringify({
            directive: event.violatedDirective,
            source: event.sourceFile,
            line: event.lineNumber,
            column: event.columnNumber,
            blocked: event.blockedURI,
          }),
      );
    });
  });
  const violations: string[] = [];
  page.on('console', (message) => {
    if (message.text().startsWith('CSP_TEST:')) violations.push(message.text());
  });
  await page.goto(`http://127.0.0.1:8089/reports/${reportFixture.id}`);
  await expect(page.getByRole('heading', { name: '分析报告' })).toBeVisible();
  await expect(page.getByRole('img', { name: /六维画像图/ }).locator('svg')).toBeVisible();
  await testInfo.attach('strict-style-result', {
    body: JSON.stringify({ violations }),
    contentType: 'application/json',
  });
  console.log('STRICT_STYLE_RESULT', JSON.stringify(violations));
  expect(violations).toEqual([]);
});

test('严格CSP覆盖其他页面及表单交互，无脚本或样式违规', async ({ page }) => {
  await page.route('**/api/v1/**', async (route) => {
    const p = new URL(route.request().url()).pathname;
    let body: unknown = {};
    if (p === '/api/v1/auth/session') body = sessionFixture;
    else if (p === '/api/v1/resumes') body = resumeListFixture;
    else if (p === '/api/v1/jobs') body = jobsFixture;
    else if (p === '/api/v1/analyses/options') body = analysisOptionsFixture;
    else if (p === '/api/v1/reports') body = { items: [], nextCursor: null };
    else if (p.includes('/tasks/')) body = queuedTask;
    else if (p.includes('/jobs/')) body = jobFixture;
    await route.fulfill({ json: body });
  });
  const violations: string[] = [];
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) =>
      console.warn('CSP_TEST:' + event.violatedDirective),
    );
  });
  page.on('console', (message) => {
    if (message.text().startsWith('CSP_TEST:')) violations.push(message.text());
  });
  for (const [path, heading] of [
    ['/login', '登录 Resume Studio'],
    ['/resumes', '简历'],
    ['/jobs', '岗位'],
    ['/jobs/new', '新建岗位'],
    ['/jobs/30000000-0000-4000-8000-000000000001', '岗位详情'],
    ['/analyses/new', '发起分析'],
    ['/reports', '报告历史'],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: heading, exact: true, level: 1 })).toBeVisible();
    if (path.startsWith('/jobs/3000')) {
      await page.getByRole('button', { name: '手工录入要求' }).click();
      await expect(page.getByLabel('要求描述', { exact: true })).toBeVisible();
    }
    expect(violations).toEqual([]);
  }
});
