import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';

import { reportFixture } from '../../../../tests/mocks/fixtures/reports';
import ReportSummary from './ReportSummary.vue';

it('PARTIAL完整展示后端计数和原因，来源revision不覆盖', () => {
  const wrapper = mount(ReportSummary, {
    props: {
      report: {
        ...reportFixture,
        sourceReportId: '40000000-0000-4000-8000-000000000009',
        revision: 2,
      },
    },
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  });
  expect(wrapper.text()).toContain('已评估 3 / 计划 4');
  expect(wrapper.text()).toContain('未完成 1');
  expect(wrapper.text()).toContain('排名仅基于已评估岗位');
  expect(wrapper.text()).toContain('处理预算已耗尽');
  expect(wrapper.text()).toContain('查看原报告');
  wrapper.unmount();
});
