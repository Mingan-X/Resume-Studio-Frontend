import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '@/shared/api/errors';

import ErrorNotice from './ErrorNotice.vue';
import RequestState from './RequestState.vue';

afterEach(() => vi.restoreAllMocks());
describe('通用状态', () => {
  it('加载、空、正常内容与错误互斥展示', async () => {
    const wrapper = mount(RequestState, {
      props: { pending: true },
      slots: { default: '<p>真实内容</p>' },
    });
    expect(wrapper.get('[role="status"]').text()).toBe('正在加载…');
    expect(wrapper.text()).not.toContain('真实内容');
    await wrapper.setProps({ pending: false, empty: true, emptyText: '还没有简历，请先上传。' });
    expect(wrapper.text()).toContain('请先上传');
    await wrapper.setProps({ empty: false });
    expect(wrapper.text()).toContain('真实内容');
    await wrapper.setProps({ error: new Error('private stack and password') });
    expect(wrapper.get('[role="alert"]').text()).toContain('页面暂时无法完成操作');
    expect(wrapper.text()).not.toContain('private');
    wrapper.unmount();
  });
  it('展示并复制请求编号，转发重试', async () => {
    const copy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const requestId = '00000000-0000-4000-8000-000000000001';
    const wrapper = mount(RequestState, {
      props: {
        error: new AppError({
          kind: 'http',
          code: 'HTTP_ERROR',
          message: '稍后重试',
          retryable: true,
          requestId,
        }),
      },
    });
    const buttons = wrapper.findAll('button');
    await buttons[0]?.trigger('click');
    await flushPromises();
    expect(copy).toHaveBeenCalledWith(requestId);
    expect(wrapper.text()).toContain('已复制');
    await buttons[1]?.trigger('click');
    expect(wrapper.emitted('retry')).toHaveLength(1);
    wrapper.unmount();
  });
  it('复制失败给出手工操作提示，404统一文案', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error());
    const wrapper = mount(ErrorNotice, {
      props: {
        error: new AppError({
          kind: 'http',
          code: 'NOT_FOUND',
          message: '资源不存在',
          status: 404,
          retryable: false,
          requestId: '00000000-0000-4000-8000-000000000001',
        }),
      },
    });
    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('复制失败');
    expect(wrapper.text()).toContain('不存在或无权访问');
    wrapper.unmount();
  });
});
