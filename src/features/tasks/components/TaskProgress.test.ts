import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  queuedTask,
  retryTask,
  taskId,
  terminalTasks,
} from '../../../../tests/mocks/fixtures/tasks';
import { server } from '../../../../tests/mocks/setup';
import TaskProgress from './TaskProgress.vue';

afterEach(() => vi.restoreAllMocks());
function render() {
  const client = new QueryClient();
  const wrapper = mount(TaskProgress, {
    props: { taskId },
    global: {
      plugins: [[VueQueryPlugin, { queryClient: client }]],
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
    },
  });
  return {
    wrapper,
    cleanup: () => {
      wrapper.unmount();
      client.clear();
    },
  };
}
describe('任务进度页', () => {
  it('显示重试时间、后端阶段和计数而非百分比', async () => {
    server.use(http.get('*/api/v1/tasks/:taskId', () => HttpResponse.json(retryTask)));
    const { wrapper, cleanup } = render();
    await expect.poll(() => wrapper.text()).toContain('等待重试');
    expect(wrapper.text()).toContain('1 / 3');
    expect(wrapper.get('time').attributes('title')).toBe(retryTask.nextRetryAt);
    expect(wrapper.text()).not.toContain('%');
    expect(wrapper.text()).not.toContain('查看报告');
    cleanup();
  });
  it.each(terminalTasks)('$status停止轮询', async (task) => {
    let calls = 0;
    server.use(
      http.get('*/api/v1/tasks/:taskId', () => {
        calls++;
        return HttpResponse.json(task);
      }),
    );
    const { wrapper, cleanup } = render();
    await expect.poll(() => wrapper.find('section').exists()).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 2200));
    expect(calls).toBe(1);
    cleanup();
  });
  it('页面隐藏时暂停，重新可见时继续请求', async () => {
    let calls = 0;
    let visibility: DocumentVisibilityState = 'visible';
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
    server.use(
      http.get('*/api/v1/tasks/:taskId', () => {
        calls++;
        return HttpResponse.json(queuedTask);
      }),
    );
    const { wrapper, cleanup } = render();
    await expect.poll(() => wrapper.find('section').exists()).toBe(true);
    visibility = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((resolve) => setTimeout(resolve, 2200));
    expect(calls).toBe(1);
    visibility = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
    await expect.poll(() => calls).toBeGreaterThan(1);
    cleanup();
  });
  it('FAILED展示安全错误和响应requestId', async () => {
    const requestId = '00000000-0000-4000-8000-000000000001';
    server.use(
      http.get('*/api/v1/tasks/:taskId', () =>
        HttpResponse.json(
          {
            ...queuedTask,
            status: 'FAILED',
            error: { code: 'EXECUTION_FAILED', message: '合成任务未能完成', retryable: false },
          },
          { headers: { 'x-request-id': requestId } },
        ),
      ),
    );
    const { wrapper, cleanup } = render();
    await expect.poll(() => wrapper.text()).toContain('合成任务未能完成');
    expect(wrapper.text()).toContain(requestId);
    cleanup();
  });
});
