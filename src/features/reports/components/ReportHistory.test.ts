import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';

import { reportFixture } from '../../../../tests/mocks/fixtures/reports';
import { server } from '../../../../tests/mocks/setup';
import ReportHistory from './ReportHistory.vue';
it('历史按游标加载并保留revision来源关系', async () => {
  let calls = 0;
  const item = {
    id: reportFixture.id,
    taskId: reportFixture.taskId,
    revision: 1,
    rootReportId: reportFixture.id,
    sourceReportId: null,
    createdAt: reportFixture.createdAt,
    status: 'PARTIAL',
    resumeVersionId: reportFixture.content.input.resumeVersionId,
    topCount: 1,
    warnings: [],
  };
  server.use(
    http.get('*/api/v1/reports', ({ request }) => {
      calls++;
      return HttpResponse.json(
        new URL(request.url).searchParams.has('cursor')
          ? {
              items: [
                {
                  ...item,
                  id: '40000000-0000-4000-8000-000000000099',
                  revision: 2,
                  sourceReportId: item.id,
                },
              ],
              nextCursor: null,
            }
          : { items: [item], nextCursor: 'opaque' },
      );
    }),
  );
  const wrapper = mount(ReportHistory, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]],
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
    },
  });
  await expect.poll(() => wrapper.text()).toContain('初始报告');
  await wrapper.get('button').trigger('click');
  await expect.poll(() => wrapper.findAll('tbody tr').length).toBe(2);
  expect(wrapper.text()).toContain('来源报告');
  expect(calls).toBe(2);
  wrapper.unmount();
});
