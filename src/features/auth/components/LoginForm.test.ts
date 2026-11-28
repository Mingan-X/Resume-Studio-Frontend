import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';
import { http, HttpResponse } from 'msw';
import { createPinia } from 'pinia';
import { expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import { server } from '../../../../tests/mocks/setup';
import LoginForm from './LoginForm.vue';
it('登录失败保留用户名并展示安全后端错误，口令清除', async () => {
  server.use(
    http.post('*/api/v1/auth/login', () =>
      HttpResponse.json(
        {
          code: 'UNAUTHENTICATED',
          message: '账号或口令无效',
          retryable: false,
          requestId: '00000000-0000-4000-8000-000000000001',
        },
        { status: 401 },
      ),
    ),
  );
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/login', component: LoginForm }],
  });
  await router.push('/login');
  const wrapper = mount(LoginForm, {
    global: {
      plugins: [createPinia(), router, [VueQueryPlugin, { queryClient: new QueryClient() }]],
    },
  });
  await wrapper.get('#login-name').setValue('synthetic-user');
  await wrapper.get('#login-password').setValue('synthetic-password-long');
  await wrapper.get('form').trigger('submit');
  await expect.poll(() => wrapper.text()).toContain('账号或口令无效');
  expect(wrapper.get('#login-name').element).toHaveProperty('value', 'synthetic-user');
  expect(wrapper.get('#login-password').element).toHaveProperty('value', '');
  wrapper.unmount();
});
