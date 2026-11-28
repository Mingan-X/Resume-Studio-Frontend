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

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
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
  it('SSE相同seq不重复刷新，收到终态后关闭连接', async () => {
    class Source extends EventTarget {
      static CLOSED = 2;
      static current: Source;
      readyState = 1;
      onopen = null;
      onerror = null;
      onmessage = null;
      close = vi.fn();
      constructor() {
        super();
        Source.current = this;
      }
    }
    vi.stubGlobal('EventSource', Source);
    let calls = 0;
    server.use(
      http.get('*/api/v1/tasks/:taskId', () => {
        calls++;
        return HttpResponse.json({ ...queuedTask, status: calls > 1 ? 'SUCCEEDED' : 'RUNNING' });
      }),
    );
    const { wrapper, cleanup } = render();
    await expect.poll(() => wrapper.find('section').exists()).toBe(true);
    const event = {
      taskId,
      seq: 1,
      stage: 'SAVE',
      counts: { schemaVersion: 1, planned: 1, completed: 1, failed: 0 },
      message: '已保存',
      createdAt: '2026-11-28T00:00:00.000Z',
    };
    Source.current.dispatchEvent(
      new MessageEvent('task', { data: JSON.stringify(event), lastEventId: '1' }),
    );
    Source.current.dispatchEvent(
      new MessageEvent('task', { data: JSON.stringify(event), lastEventId: '1' }),
    );
    await expect.poll(() => wrapper.get('.status').text()).toBe('已完成');
    expect(calls).toBe(2);
    expect(Source.current.close).toHaveBeenCalled();
    cleanup();
  });
  it('真实分析阶段计数原样显示，有reportId才提供入口', async () => {
    server.use(
      http.get('*/api/v1/tasks/:taskId', () =>
        HttpResponse.json({
          ...queuedTask,
          status: 'PARTIAL',
          stage: 'MATCH',
          progress: { completed: 8, total: 20 },
          reportId: '40000000-0000-4000-8000-000000000001',
        }),
      ),
    );
    const { wrapper, cleanup } = render();
    await expect.poll(() => wrapper.text()).toContain('逐项匹配');
    expect(wrapper.text()).toContain('8 / 20');
    expect(wrapper.text()).toContain('查看报告');
    expect(wrapper.text()).not.toContain('%');
    cleanup();
  });
  it('取消提交期间禁用按钮，失败保留状态与requestId', async () => {
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let posts = 0;
    server.use(
      http.post('*/api/v1/tasks/:taskId/cancel', async ({ request }) => {
        posts++;
        expect(await request.json()).toEqual({});
        await gate;
        return HttpResponse.json(
          {
            code: 'INTERNAL_ERROR',
            message: '暂时不能取消',
            retryable: false,
            requestId: '00000000-0000-4000-8000-000000000001',
          },
          { status: 500 },
        );
      }),
    );
    const { wrapper, cleanup } = render();
    await expect.poll(() => wrapper.find('section').exists()).toBe(true);
    const button = wrapper.findAll('button').find((item) => item.text() === '取消任务');
    if (!button) throw new Error('missing cancellation');
    await button.trigger('click');
    await expect.poll(() => posts).toBe(1);
    expect(button.attributes('disabled')).toBeDefined();
    await button.trigger('click');
    expect(posts).toBe(1);
    release?.();
    await expect.poll(() => wrapper.text()).toContain('暂时不能取消');
    expect(wrapper.text()).toContain('00000000-0000-4000-8000-000000000001');
    expect(wrapper.text()).toContain('等待处理');
    cleanup();
  });
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
