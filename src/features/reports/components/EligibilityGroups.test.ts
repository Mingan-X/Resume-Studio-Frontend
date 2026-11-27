import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';

import { reportFixture } from '../../../../tests/mocks/fixtures/reports';
import EligibilityGroups from './EligibilityGroups.vue';
it('待核实单列无总分，未完成不冒充unknown，硬条件不符合有具体解释', () => {
  const wrapper = mount(EligibilityGroups, {
    props: { content: reportFixture.content },
    global: {
      plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]],
      stubs: { RouterLink: true },
    },
  });
  const pending = wrapper.get('[aria-labelledby="pending-title"]');
  expect(pending.text()).toContain('待核实合成岗位');
  expect(pending.text()).not.toContain('21.37');
  expect(pending.text()).toContain('未完成判断');
  expect(pending.text()).toContain('证据不足');
  const failed = wrapper.get('[aria-labelledby="ineligible-title"]');
  expect(failed.text()).toContain('不符合合成岗位');
  expect(failed.text()).toContain('证据明确不满足该要求');
  wrapper.unmount();
});
