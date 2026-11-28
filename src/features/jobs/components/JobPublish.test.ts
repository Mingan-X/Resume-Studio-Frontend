import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { http, HttpResponse } from 'msw';
import { afterEach, expect, it, vi } from 'vitest';

import { jobFixture } from '../../../../tests/mocks/fixtures/jobs';
import { server } from '../../../../tests/mocks/setup';
import JobPublish from './JobPublish.vue';

afterEach(() => vi.unstubAllGlobals());
it('发布响应丢失后手工重试跳过已完成确认并复用原键', async () => {
  vi.stubGlobal(
    'confirm',
    vi.fn(() => true),
  );
  const keys: (string | null)[] = [];
  let confirms = 0;
  server.use(
    http.post('*/api/v1/jobs/:jobId/versions/:versionId/confirm', () => {
      confirms++;
      return confirms === 1
        ? HttpResponse.json({
            ...jobFixture,
            hardRequirementsConfirmed: true,
            weightsConfirmed: true,
          })
        : HttpResponse.json(
            {
              code: 'INVALID_STATE',
              message: '已发布',
              retryable: false,
              requestId: '00000000-0000-4000-8000-000000000001',
            },
            { status: 409 },
          );
    }),
    http.post('*/api/v1/jobs/:jobId/versions/:versionId/publish', ({ request }) => {
      keys.push(request.headers.get('idempotency-key'));
      return keys.length <= 3
        ? HttpResponse.json(
            {
              code: 'HTTP_ERROR',
              message: '临时网络边界错误',
              retryable: true,
              requestId: '00000000-0000-4000-8000-000000000001',
            },
            { status: 503 },
          )
        : HttpResponse.json(
            { jobVersionId: jobFixture.id, taskId: '30000000-0000-4000-8000-000000000004' },
            { status: 202 },
          );
    }),
  );
  const wrapper = mount(JobPublish, {
    props: { job: jobFixture },
    global: {
      plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]],
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
    },
  });
  for (const input of wrapper.findAll('input')) await input.setValue(true);
  await wrapper.get('button').trigger('click');
  await expect.poll(() => wrapper.text(), { timeout: 3000 }).toContain('临时网络边界错误');
  await wrapper
    .findAll('button')
    .find((button) => button.text() === '重试')
    ?.trigger('click');
  await expect.poll(() => wrapper.text()).toContain('岗位已发布');
  expect(confirms).toBe(1);
  expect(new Set(keys).size).toBe(1);
  wrapper.unmount();
});
it('网络重试保持同一发布键，请求期间禁用重复提交', async () => {
  vi.stubGlobal(
    'confirm',
    vi.fn(() => true),
  );
  const keys: (string | null)[] = [];
  server.use(
    http.post('*/api/v1/jobs/:jobId/versions/:versionId/confirm', () =>
      HttpResponse.json({ ...jobFixture, hardRequirementsConfirmed: true, weightsConfirmed: true }),
    ),
    http.post('*/api/v1/jobs/:jobId/versions/:versionId/publish', ({ request }) => {
      keys.push(request.headers.get('idempotency-key'));
      return keys.length === 1
        ? HttpResponse.error()
        : HttpResponse.json(
            { jobVersionId: jobFixture.id, taskId: '30000000-0000-4000-8000-000000000004' },
            { status: 202 },
          );
    }),
  );
  const wrapper = mount(JobPublish, {
    props: { job: jobFixture },
    global: {
      plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]],
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
    },
  });
  for (const checkbox of wrapper.findAll('input')) await checkbox.setValue(true);
  await wrapper.get('button').trigger('click');
  await expect.poll(() => wrapper.get('button').attributes('disabled')).toBeDefined();
  await expect.poll(() => wrapper.text(), { timeout: 3000 }).toContain('岗位已发布');
  expect(keys).toHaveLength(2);
  expect(keys[0]).toBe(keys[1]);
  expect(keys[0]).toMatch(/^[0-9a-f-]{36}$/);
  wrapper.unmount();
});
