import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';

import { AppError } from '@/shared/api/errors';
import { uploadRequest } from '@/shared/api/upload';

import { resumeFixture } from '../../../../tests/mocks/fixtures/resumes';
import { useUploadResumeMutation } from './useUploadResumeMutation';

vi.mock('@/shared/api/upload', () => ({ uploadRequest: vi.fn() }));
describe('上传操作身份', () => {
  it('同文件失败后重试复用键，选择新文件换键，成功禁止再次提交', async () => {
    const transport = vi
      .mocked(uploadRequest)
      .mockRejectedValueOnce(
        new AppError({
          kind: 'network',
          code: 'NETWORK_ERROR',
          message: '网络失败',
          retryable: true,
        }),
      )
      .mockResolvedValue(resumeFixture);
    let upload: ReturnType<typeof useUploadResumeMutation> | undefined;
    const wrapper = mount(
      defineComponent({
        setup() {
          upload = useUploadResumeMutation();
          return () => null;
        },
      }),
      { global: { plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]] } },
    );
    if (!upload) throw new Error('missing upload state');
    upload.selectFile(new File(['one'], 'one.pdf'));
    upload.submit();
    upload.submit();
    await flushPromises();
    expect(transport).toHaveBeenCalledTimes(1);
    const firstKey = transport.mock.calls[0]?.[3].idempotencyKey;
    upload.submit();
    await flushPromises();
    expect(transport.mock.calls[1]?.[3].idempotencyKey).toBe(firstKey);
    upload.submit();
    await flushPromises();
    expect(transport).toHaveBeenCalledTimes(2);
    upload.selectFile(new File(['two'], 'two.docx'));
    upload.submit();
    await flushPromises();
    expect(transport.mock.calls[2]?.[3].idempotencyKey).not.toBe(firstKey);
    wrapper.unmount();
  });
});
