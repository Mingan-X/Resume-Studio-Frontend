import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';

import { reportFixture } from '../../../../tests/mocks/fixtures/reports';
import StructuredResume from './StructuredResume.vue';
it('null与空数组显示未识别，HTML证据不可执行且可查简历映射', async () => {
  const wrapper = mount(StructuredResume, {
    props: { content: reportFixture.content },
    global: {
      plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]],
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
    },
  });
  expect(wrapper.text()).toContain('学校：未识别');
  expect(wrapper.text()).toContain('合成测试技能：未识别');
  expect(wrapper.find('img,script').exists()).toBe(false);
  expect(wrapper.text()).toContain('<script>danger()</script>');
  await wrapper.findAll('button')[0]?.trigger('click');
  await expect.poll(() => wrapper.text()).toContain('打开简历来源位置');
  wrapper.unmount();
});
