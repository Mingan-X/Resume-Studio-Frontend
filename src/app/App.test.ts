import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import App from './App.vue';

describe('工程入口', () => {
  it('显示工作台名称和用途', () => {
    const wrapper = mount(App, { global: { stubs: { HealthStatus: true } } });
    expect(wrapper.get('h1').text()).toBe('Resume Studio');
    expect(wrapper.text()).toContain('简历分析工作台');
    wrapper.unmount();
  });
});
