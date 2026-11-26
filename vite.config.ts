import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv } from 'vite';

import { environmentSchema } from './src/shared/config/environment.ts';
import { transportProbePlugin } from './tests/mocks/transportPlugin.ts';

export default defineConfig(({ command, mode }) => {
  const environment = environmentSchema.parse(loadEnv(mode, process.cwd(), 'VITE_'));
  if (command === 'build' && environment.VITE_ENABLE_MOCKS === 'true') {
    throw new Error('生产构建禁止启用MSW');
  }
  return {
    publicDir: environment.VITE_ENABLE_MOCKS === 'true' ? 'tests/mocks/public' : 'public',
    plugins: [vue(), ...(command === 'serve' && mode === 'e2e' ? [transportProbePlugin()] : [])],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    build: { sourcemap: false },
    server: {
      proxy: {
        '/api': { target: 'http://127.0.0.1:3000', changeOrigin: false },
        '/health': { target: 'http://127.0.0.1:3000', changeOrigin: false },
      },
    },
  };
});
