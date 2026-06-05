import { defineConfig } from '@playwright/test';

const baseURL = process.env.KRADLE_E2E_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    storageState: process.env.KRADLE_E2E_AUTH_STATE || undefined,
    extraHTTPHeaders: {
      'x-forwarded-user': process.env.KRADLE_E2E_USER || 'e2e-test-user',
      'x-forwarded-email': process.env.KRADLE_E2E_EMAIL || 'e2e@test.kradle.local',
    },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: process.env.KRADLE_E2E_URL ? undefined : {
    command: 'npm run dev',
    port: 3000,
    timeout: 60_000,
    reuseExistingServer: true,
  },
});
