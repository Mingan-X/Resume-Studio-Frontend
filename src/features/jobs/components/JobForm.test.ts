import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';

import { server } from '../../../../tests/mocks/setup';
import JobForm from './JobForm.vue';

it('后端字段错误定位且保留JD与名称', async () => {
  server.use(
    http.post('*/api/v1/jobs', () =>
      HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: '岗位名称无效',
          retryable: false,
          requestId: '00000000-0000-4000-8000-000000000001',
          details: { fields: [{ path: 'title', code: 'INVALID' }] },
        },
        { status: 400 },
      ),
    ),
  );
  const wrapper = mount(JobForm, {
    global: { plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]] },
  });
  await wrapper.get('#job-title').setValue('合成岗位');
  await wrapper.get('#jd-body').setValue('<script>合成内容</script>');
  await wrapper.get('form').trigger('submit');
  await expect.poll(() => wrapper.text()).toContain('岗位名称无效');
  expect(wrapper.get('#job-title').element).toHaveProperty('value', '合成岗位');
  expect(wrapper.get('#jd-body').element).toHaveProperty('value', '<script>合成内容</script>');
  expect(wrapper.get('#job-title').element.nextElementSibling?.textContent).toContain(
    '请检查此字段',
  );
  wrapper.unmount();
});
