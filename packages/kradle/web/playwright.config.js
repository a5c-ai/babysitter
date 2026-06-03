import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: process.env.KRADLE_E2E_URL || 'http://localhost:3000',
    ignoreHTTPSErrors: true,
    storageState: process.env.KRADLE_E2E_AUTH_STATE || undefined,
  },
  webServer: process.env.KRADLE_E2E_URL ? undefined : {
    command: 'npm run dev',
    port: 3000,
    timeout: 60000,
    reuseExistingServer: true,
  },
});
