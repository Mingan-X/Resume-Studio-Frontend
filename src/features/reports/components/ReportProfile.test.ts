import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';

import { reportFixture } from '../../../../tests/mocks/fixtures/reports';
import ReportProfile from './ReportProfile.vue';
it('画像表格与证据不足文案独立于图表可读', () => {
  const wrapper = mount(ReportProfile, {
    props: { content: reportFixture.content },
    global: {
      plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]],
      stubs: { ProfileChart: true, RouterLink: true },
    },
  });
  expect(wrapper.findAll('tbody tr')).toHaveLength(6);
  expect(wrapper.text()).toContain('证据不足：协作沟通、成长性');
  expect(wrapper.text()).toContain('—（证据不足）');
  expect(wrapper.text()).toContain('66.37');
  wrapper.unmount();
});
