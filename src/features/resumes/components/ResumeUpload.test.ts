import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '../../../../tests/mocks/setup';
import ResumeUpload from './ResumeUpload.vue';

function render() {
  return mount(ResumeUpload, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]],
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
    },
  });
}
async function choose(wrapper: ReturnType<typeof render>, file: File) {
  const input = wrapper.get('input').element;
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  await wrapper.get('input').trigger('change');
}
describe('简历上传区域', () => {
  it('格式、空文件和大小预检不发送请求', async () => {
    const wrapper = render();
    for (const [file, message] of [
      [new File(['x'], 'old.doc'), '不支持该格式'],
      [new File([], 'empty.pdf'), '文件为空'],
      [new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.pdf'), '超过10 MiB'],
    ] as const) {
      await choose(wrapper, file);
      expect(wrapper.get('[role="alert"]').text()).toContain(message);
      expect(wrapper.get('button').attributes('disabled')).toBeDefined();
    }
    wrapper.unmount();
  });
  it.each(['SCANNED_PDF', 'ENCRYPTED_FILE', 'FILE_TOO_LARGE'])(
    '%s显示后端原因及可复制请求编号',
    async (reason) => {
      server.use(
        http.post('*/api/v1/resumes', () =>
          HttpResponse.json(
            {
              code: reason === 'FILE_TOO_LARGE' ? 'PAYLOAD_TOO_LARGE' : 'UNSUPPORTED_FILE',
              reason,
              message: '合成文件未通过解析校验',
              requestId: '00000000-0000-4000-8000-000000000001',
              retryable: false,
            },
            { status: reason === 'FILE_TOO_LARGE' ? 413 : 422 },
          ),
        ),
      );
      const wrapper = render();
      await choose(wrapper, new File(['x'], 'test.pdf'));
      await wrapper.get('button').trigger('click');
      await expect.poll(() => wrapper.text()).toContain('合成文件未通过解析校验');
      expect(wrapper.text()).toContain('00000000-0000-4000-8000-000000000001');
      if (reason !== 'FILE_TOO_LARGE') expect(wrapper.text()).toContain('不支持');
      wrapper.unmount();
    },
  );
  it('上传时禁止重复提交，取消后不自动重试', async () => {
    let posts = 0;
    server.use(
      http.post('*/api/v1/resumes', async () => {
        posts++;
        await delay(200);
        return HttpResponse.json({});
      }),
    );
    const wrapper = render();
    await choose(wrapper, new File(['x'], 'test.docx'));
    await wrapper.get('button').trigger('click');
    await expect.poll(() => posts).toBe(1);
    expect(wrapper.get('input').attributes('disabled')).toBeDefined();
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '取消上传')
      ?.trigger('click');
    await expect.poll(() => wrapper.text()).toContain('请求已取消');
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(posts).toBe(1);
    wrapper.unmount();
  });
});
