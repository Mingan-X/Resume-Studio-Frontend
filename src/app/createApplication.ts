import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { ElButton } from 'element-plus';
import { createPinia } from 'pinia';
import { createApp } from 'vue';

import { useSessionStore } from '@/features/auth';
import { environmentSchema } from '@/shared/config/environment';

import App from './App.vue';
import { installAuthFailureHandling } from './auth';
import { installErrorHandlers } from './errors';
import { createApplicationRouter } from './router';

import 'element-plus/es/components/base/style/css';
import 'element-plus/es/components/button/style/css';
import './styles/tokens.css';

export function createApplication() {
  const pinia = createPinia(),
    client = new QueryClient(),
    router = createApplicationRouter(client, pinia);
  const app = createApp(App)
    .use(pinia)
    .use(ElButton)
    .use(VueQueryPlugin, { queryClient: client })
    .use(router);
  const cleanup = installAuthFailureHandling(router, client, useSessionStore(pinia));
  app.onUnmount(cleanup);
  installErrorHandlers(app);
  return app;
}

export async function mountApplication() {
  const environment = environmentSchema.parse(import.meta.env);
  document.title = environment.VITE_APP_TITLE;
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS === 'true') {
    const { startMocks } = await import('../../tests/mocks/browser');
    await startMocks();
  }
  createApplication().mount('#app');
}
