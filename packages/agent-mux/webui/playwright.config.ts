import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, devices } from "@playwright/test";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const testPort = Number.parseInt(process.env.AMUX_WEBUI_E2E_PORT ?? "4175", 10);

export default defineConfig({
  testDir: path.join(packageRoot, "e2e", "tests"),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  outputDir: path.join(packageRoot, ".tmp", "playwright-test-results"),
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: path.join(packageRoot, ".tmp", "playwright-report") }],
  ],
  use: {
    baseURL: `http://127.0.0.1:${testPort}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: {
      width: 1600,
      height: 1100,
    },
    launchOptions: {
      args: ["--disable-gpu"],
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: {
    command: `node ./e2e/support/start-webui-e2e-server.mjs`,
    cwd: packageRoot,
    port: testPort,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      AMUX_WEBUI_E2E_PORT: String(testPort),
    },
  },
});
