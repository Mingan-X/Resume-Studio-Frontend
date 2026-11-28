import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { http, HttpResponse } from 'msw';
import { expect, it } from 'vitest';
import { defineComponent, ref } from 'vue';

import { reportFixture } from '../../../../tests/mocks/fixtures/reports';
import { derivedReport } from '../../../../tests/mocks/reportHandlers';
import { server } from '../../../../tests/mocks/setup';
import { useRecompute } from './useRecompute';
it('重算重试同键、输入变更换键、原快照不被修改', async () => {
  const original = JSON.stringify(reportFixture),
    keys: (string | null)[] = [];
  server.use(
    http.post('*/api/v1/reports/:reportId/recompute', ({ request }) => {
      keys.push(request.headers.get('idempotency-key'));
      return keys.length === 1
        ? HttpResponse.error()
        : HttpResponse.json(derivedReport, { status: 201 });
    }),
  );
  const weights = ref(
    reportFixture.content.ranking?.results.map((result) => ({
      jobVersionId: result.jobVersionId,
      weights: structuredClone(result.weightsSnapshot),
    })) ?? [],
  );
  let mutation: ReturnType<typeof useRecompute> | undefined;
  const wrapper = mount(
    defineComponent({
      setup() {
        mutation = useRecompute(reportFixture.id, () => ({ weights: weights.value }));
        return () => null;
      },
    }),
    { global: { plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]] } },
  );
  if (!mutation) throw new Error('mutation');
  await mutation.mutateAsync();
  expect(keys[0]).toBe(keys[1]);
  const first = weights.value[0]?.weights.dimensionWeights[0];
  if (first) first.weight = 2.5;
  await mutation.mutateAsync();
  expect(keys[2]).not.toBe(keys[1]);
  expect(JSON.stringify(reportFixture)).toBe(original);
  wrapper.unmount();
});
