import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'ui', testIgnore: '**/*.smoke.spec.ts', use: { ...devices['Desktop Chrome'] } },
    { name: 'real', testMatch: '**/*.smoke.spec.ts', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'auth-real',
      testMatch: '**/auth.smoke.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://localhost:4443',
        ignoreHTTPSErrors: true,
        trace: 'off',
      },
    },
  ],
  webServer: {
    command: 'pnpm run dev --mode e2e --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    env: {
      VITE_ENABLE_MOCKS: process.argv.some(
        (arg) => arg === '--project=real' || arg === '--project=auth-real',
      )
        ? 'false'
        : 'true',
    },
  },
});
