import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { http, HttpResponse } from 'msw';
import { afterEach, expect, it, vi } from 'vitest';

import { jobFixture } from '../../../../tests/mocks/fixtures/jobs';
import { server } from '../../../../tests/mocks/setup';
import JobPublish from './JobPublish.vue';

afterEach(() => vi.unstubAllGlobals());
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
