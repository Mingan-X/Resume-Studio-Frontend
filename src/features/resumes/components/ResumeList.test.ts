import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { resumeId, resumeListFixture } from '../../../../tests/mocks/fixtures/resumes';
import { server } from '../../../../tests/mocks/setup';
import ResumeList from './ResumeList.vue';

function render() {
  return mount(ResumeList, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]],
      stubs: { ResumeUpload: true, RouterLink: { template: '<a><slot /></a>' } },
    },
  });
}
describe('简历列表', () => {
  it('骨架加载后按不透明游标追加，不重复不遗漏', async () => {
    const cursors: (string | null)[] = [];
    server.use(
      http.get('*/api/v1/resumes', ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor');
        cursors.push(cursor);
        return HttpResponse.json(
          cursor
            ? {
                items: [
                  { ...resumeListFixture.items[0], id: '20000000-0000-4000-8000-000000000001' },
                ],
                nextCursor: null,
              }
            : { ...resumeListFixture, nextCursor: 'opaque/next+=' },
        );
      }),
    );
    const wrapper = render();
    expect(wrapper.text()).toContain('正在加载');
    await expect.poll(() => wrapper.text()).toContain(resumeId);
    await wrapper.get('button').trigger('click');
    await expect.poll(() => wrapper.findAll('tbody tr').length).toBe(2);
    expect(cursors).toEqual([null, 'opaque/next+=']);
    expect(wrapper.text().split(resumeId)).toHaveLength(2);
    expect(wrapper.find('button').exists()).toBe(false);
    wrapper.unmount();
  });
  it('空状态说明上传入口', async () => {
    server.use(
      http.get('*/api/v1/resumes', () => HttpResponse.json({ items: [], nextCursor: null })),
    );
    const wrapper = render();
    await expect.poll(() => wrapper.text()).toContain('还没有简历');
    wrapper.unmount();
  });
  it('错误显示后端message与requestId', async () => {
    server.use(
      http.get('*/api/v1/resumes', () =>
        HttpResponse.json(
          {
            code: 'INTERNAL_ERROR',
            message: '暂不能读取列表',
            retryable: false,
            requestId: '00000000-0000-4000-8000-000000000001',
          },
          { status: 500 },
        ),
      ),
    );
    const wrapper = render();
    await expect.poll(() => wrapper.text()).toContain('暂不能读取列表');
    expect(wrapper.text()).toContain('00000000-0000-4000-8000-000000000001');
    wrapper.unmount();
  });
});
