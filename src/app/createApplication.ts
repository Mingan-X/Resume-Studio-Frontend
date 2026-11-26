import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { createApp } from 'vue';

import { environmentSchema } from '@/shared/config/environment';

import App from './App.vue';

import './styles/tokens.css';

export function createApplication() {
  return createApp(App).use(VueQueryPlugin, { queryClient: new QueryClient() });
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
