import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { onScopeDispose, ref, shallowRef } from 'vue';

import { AppError } from '@/shared/api/errors';
import { uploadRequest } from '@/shared/api/upload';

import { resumeVersionSchema } from '../model/contracts';
import { resumeKeys } from './keys';

export function useUploadResumeMutation() {
  const client = useQueryClient();
  const file = shallowRef<File>();
  const key = ref('');
  const loaded = ref(0),
    total = ref<number | null>(null);
  let controller: AbortController | undefined;
  const mutation = useMutation({
    retry: false,
    mutationFn: async () => {
      if (!file.value)
        throw new AppError({
          kind: 'contract',
          code: 'FILE_REQUIRED',
          message: '请先选择文件。',
          retryable: false,
        });
      controller = new AbortController();
      loaded.value = 0;
      total.value = null;
      const body = new FormData();
      body.append('file', file.value);
      return uploadRequest('/resumes', body, resumeVersionSchema, {
        idempotencyKey: key.value,
        signal: controller.signal,
        onProgress: (bytes, size) => {
          loaded.value = bytes;
          total.value = size;
        },
      });
    },
    onSuccess: async (data) => {
      client.setQueryData(resumeKeys.version(data.resumeId, data.resumeVersionId), data);
      await client.invalidateQueries({ queryKey: resumeKeys.lists, exact: true });
    },
  });
  function selectFile(next: File) {
    if (mutation.isPending.value) return;
    file.value = next;
    key.value = crypto.randomUUID();
    mutation.reset();
    loaded.value = 0;
    total.value = null;
  }
  function submit() {
    if (mutation.isPending.value || mutation.isSuccess.value) return;
    mutation.mutate();
  }
  function cancel() {
    controller?.abort();
  }
  onScopeDispose(cancel);
  return { ...mutation, file, loaded, total, selectFile, submit, cancel };
}
