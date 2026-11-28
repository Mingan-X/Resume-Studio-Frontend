import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';

import { reportFixture } from '../../../../tests/mocks/fixtures/reports';
import { server } from '../../../../tests/mocks/setup';
import ReportRecompute from './ReportRecompute.vue';
it('后端权重字段错误保留表单值并定位到对应维度', async () => {
  server.use(
    http.post('*/api/v1/reports/:reportId/recompute', () =>
      HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: '权重无效',
          retryable: false,
          requestId: '00000000-0000-4000-8000-000000000001',
          details: {
            fields: [{ path: 'weights.0.weights.dimensionWeights.0.weight', code: 'INVALID' }],
          },
        },
        { status: 400 },
      ),
    ),
  );
  const wrapper = mount(ReportRecompute, {
    props: { report: reportFixture },
    global: { plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]] },
  });
  await wrapper.get('input').setValue(3.25);
  await wrapper.get('form').trigger('submit');
  await expect.poll(() => wrapper.text()).toContain('权重无效');
  expect(wrapper.get('input').element).toHaveProperty('value', '3.25');
  expect(wrapper.get('input').element.nextElementSibling?.textContent).toContain('请检查此字段');
  wrapper.unmount();
});
