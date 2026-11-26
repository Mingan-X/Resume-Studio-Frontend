import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { flushPromises, mount } from '@vue/test-utils';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '../../../../tests/mocks/setup';
import HealthStatus from './HealthStatus.vue';

function render() {
  return mount(HealthStatus, {
    global: { plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]] },
  });
}

describe('健康状态', () => {
  it('加载后显示后端状态与环境', async () => {
    const wrapper = render();
    expect(wrapper.text()).toContain('正在检查');
    await flushPromises();
    await expect.poll(() => wrapper.text()).toContain('test');
    expect(wrapper.text()).toContain('已连接（ok）');
    wrapper.unmount();
  });
  it('网络失败给出重试入口，恢复后可重新检查', async () => {
    server.use(http.get('*/health', () => HttpResponse.error()));
    const wrapper = render();
    await expect.poll(() => wrapper.text(), { timeout: 4000 }).toContain('网络连接失败');
    server.resetHandlers();
    await wrapper.get('button').trigger('click');
    await expect.poll(() => wrapper.text()).toContain('已连接');
    wrapper.unmount();
  });
  it.each([
    ['服务失败', () => new HttpResponse(null, { status: 503 }), '服务暂不可用'],
    ['错误结构', () => HttpResponse.json({ status: 'ok' }), '服务响应格式异常'],
    ['非法JSON', () => new HttpResponse('bad json'), '服务响应格式异常'],
  ])('%s明确提示', async (_name, response, expected) => {
    server.use(http.get('*/health', response));
    const wrapper = render();
    await expect.poll(() => wrapper.text()).toContain(expected);
    wrapper.unmount();
  });
});
