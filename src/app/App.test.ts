import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import App from './App.vue';

describe('工程入口', () => {
  it('显示工作台、导航与按需健康检查', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/resumes', component: { template: '<h1>简历</h1>' } }],
    });
    await router.push('/resumes');
    const wrapper = mount(App, { global: { plugins: [router], stubs: { HealthStatus: true } } });
    expect(wrapper.text()).toContain('Resume Studio');
    expect(wrapper.text()).toContain('简历分析工作台');
    expect(wrapper.get('nav').findAll('a')).toHaveLength(4);
    expect(wrapper.find('health-status-stub').exists()).toBe(false);
    await wrapper.get('button').trigger('click');
    expect(wrapper.find('health-status-stub').exists()).toBe(true);
    wrapper.unmount();
  });
});
