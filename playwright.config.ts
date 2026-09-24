import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5175',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.CAMDIAG_E2E_EXTERNAL_SERVER === 'true' ? undefined : {
    command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5175',
    url: 'http://localhost:5175',
    reuseExistingServer: false,
    env: {
      VITE_E2E_AUTH_BYPASS: 'true',
      VITE_API_URL: 'http://localhost:5175/__test_api',
      VITE_RECAPTCHA_ENTERPRISE_SITE_KEY: '',
      CAMDIAG_E2E: 'true',
    },
  },
});
