import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';
import { defineComponent, reactive } from 'vue';

import { resumeVersionId } from '../../../../tests/mocks/fixtures/resumes';
import { taskId } from '../../../../tests/mocks/fixtures/tasks';
import { server } from '../../../../tests/mocks/setup';
import { useCreateAnalysisMutation } from './queries';

it('分析输入变化换键，重试复用同一操作键', async () => {
  const keys: (string | null)[] = [];
  server.use(
    http.post('*/api/v1/analyses', ({ request }) => {
      keys.push(request.headers.get('idempotency-key'));
      return keys.length === 1
        ? HttpResponse.error()
        : HttpResponse.json({ taskId, statusUrl: `/api/v1/tasks/${taskId}` }, { status: 202 });
    }),
  );
  const input = reactive({
    resumeVersionId,
    jobCorpusVersionId: 'synthetic-corpus-v1',
    asOfDate: '2026-11-28',
  });
  let mutation: ReturnType<typeof useCreateAnalysisMutation> | undefined;
  const wrapper = mount(
    defineComponent({
      setup() {
        mutation = useCreateAnalysisMutation(() => ({ ...input }));
        return () => null;
      },
    }),
    { global: { plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]] } },
  );
  if (!mutation) throw new Error('missing mutation');
  await mutation.mutateAsync();
  expect(keys).toHaveLength(2);
  expect(keys[0]).toBe(keys[1]);
  input.asOfDate = '2026-11-27';
  await mutation.mutateAsync();
  expect(keys[2]).not.toBe(keys[1]);
  wrapper.unmount();
});
