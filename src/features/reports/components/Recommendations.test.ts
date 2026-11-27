import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';

import { reportFixture } from '../../../../tests/mocks/fixtures/reports';
import ReportRecommendations from './ReportRecommendations.vue';
import RequirementJudgments from './RequirementJudgments.vue';
it('按后端推荐ID顺序展示原始分数，不补占位或把pending混入', () => {
  const wrapper = mount(ReportRecommendations, {
    props: { content: reportFixture.content },
    global: {
      plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]],
      stubs: { RouterLink: true },
    },
  });
  expect(wrapper.findAll('.recommendation')).toHaveLength(1);
  expect(wrapper.text()).toContain('63.47分 · 覆盖率72.11% · 上界91.23');
  expect(wrapper.text()).toContain('候选岗位不足10个');
  expect(wrapper.text()).not.toContain('待核实合成岗位');
  expect(wrapper.text()).toContain('贡献 47.13');
  wrapper.unmount();
});
it('unknown/unmet文字及语义样式分别展示，HTML证据仅文本', () => {
  for (const [index, label, selector] of [
    [1, '证据不足', '.verdict-unknown'],
    [2, '不满足', '.verdict-unmet'],
  ] as const) {
    const result = reportFixture.content.ranking?.results[index];
    if (!result) throw new Error('fixture');
    const wrapper = mount(RequirementJudgments, {
      props: { result, content: reportFixture.content },
      global: {
        plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]],
        stubs: { RouterLink: true },
      },
    });
    expect(wrapper.get(selector).text()).toContain(label);
    expect(wrapper.find('img,script').exists()).toBe(false);
    wrapper.unmount();
  }
});
