/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: './tests/browser',
  timeout: 120_000,
  expect: {
    timeout: 30_000,
  },
  use: {
    headless: true,
  },
  retries: 0,
  workers: 1,
  reporter: 'list',
};

export default config;
