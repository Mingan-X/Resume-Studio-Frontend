import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { resumeFixture, resumeId, resumeVersionId } from '../../../../tests/mocks/fixtures/resumes';
import { server } from '../../../../tests/mocks/setup';
import ResumeDetail from './ResumeDetail.vue';

function render() {
  return mount(ResumeDetail, {
    props: { resumeId, versionId: resumeVersionId },
    global: { plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]] },
  });
}
describe('解析详情', () => {
  it('保留文本和稳定锚点，HTML文本不成为DOM，不显示结构化字段', async () => {
    const wrapper = render();
    await expect.poll(() => wrapper.findAll('article').length).toBe(2);
    expect(wrapper.text()).toContain('<script>danger()</script>');
    expect(wrapper.find('script,img').exists()).toBe(false);
    expect(wrapper.get('article').attributes('id')).toBe(
      'block-' + resumeFixture.extractedDocument.blocks[0]?.id,
    );
    expect(wrapper.text()).toContain('阅读顺序可能不准确');
    expect(wrapper.text()).not.toContain('教育经历');
    wrapper.unmount();
  });
  it('不可见资源统一显示不存在或无权访问', async () => {
    server.use(
      http.get('*/api/v1/resumes/:resumeId/versions/:versionId', () =>
        HttpResponse.json(
          {
            code: 'NOT_FOUND',
            message: '资源不存在',
            retryable: false,
            requestId: '00000000-0000-4000-8000-000000000001',
          },
          { status: 404 },
        ),
      ),
    );
    const wrapper = render();
    await expect.poll(() => wrapper.text()).toContain('不存在或无权访问');
    wrapper.unmount();
  });
});
