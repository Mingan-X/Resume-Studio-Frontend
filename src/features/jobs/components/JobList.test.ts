import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';

import { jobFixture, jobsFixture } from '../../../../tests/mocks/fixtures/jobs';
import { server } from '../../../../tests/mocks/setup';
import JobList from './JobList.vue';

it.each(['FAILED', 'PENDING', 'FUTURE'])('%s岗位明确未参与召回', async (status) => {
  server.use(
    http.get('*/api/v1/jobs', () =>
      HttpResponse.json({
        ...jobsFixture,
        items: [{ ...jobsFixture.items[0], latestVersion: { ...jobFixture, indexStatus: status } }],
      }),
    ),
  );
  const wrapper = mount(JobList, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]],
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
    },
  });
  await expect.poll(() => wrapper.text()).toContain('合成工程师');
  expect(wrapper.text()).toContain('未参与召回');
  if (status === 'FUTURE') expect(wrapper.text()).toContain('索引状态待确认');
  wrapper.unmount();
});
