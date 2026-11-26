import { mergeConfig } from 'vite';
import { defineConfig } from 'vitest/config';

import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'happy-dom',
      include: ['src/**/*.test.ts', 'tests/contract/**/*.test.ts'],
      clearMocks: true,
      restoreMocks: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'json-summary'],
        include: ['src/**/*.{ts,vue}'],
        exclude: ['src/main.ts', 'src/generated/**'],
        thresholds: {
          'src/shared/**': { lines: 80 },
          'src/features/*/model/**': { lines: 80 },
        },
      },
    },
  }),
);
