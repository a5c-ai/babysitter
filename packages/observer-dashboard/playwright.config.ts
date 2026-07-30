import { defineConfig, devices } from "@playwright/test";
import path from "path";

/**
 * Playwright E2E configuration for the Observer dashboard.
 *
 * The webServer is started with WATCH_DIR pointing to the fixture runs
 * directory so that the observer dashboard displays deterministic test data.
 *
 * @see https://playwright.dev/docs/test-configuration
 */

const fixtureRunsDir = path.resolve(__dirname, "e2e/fixtures/runs");

// Use a dedicated test port to avoid collisions with a running dev server.
// The dev server on port 4800 uses real data; the E2E server on 4173 uses fixtures.
const testPort = parseInt(process.env.OBSERVER_PORT || "4173", 10);

// Browser resolution overrides (opt-in; defaults keep Playwright's bundled chromium
// so CI is unchanged). On hosts where the bundled browser can't be installed
// (e.g. newer distros), point the run at an installed browser:
//   PLAYWRIGHT_CHROME_CHANNEL=chrome   npm run test:e2e   # use system Google Chrome
//   OBSERVER_CHROMIUM_PATH=/path/chrome npm run test:e2e   # use an explicit binary
const chromeChannel = process.env.PLAYWRIGHT_CHROME_CHANNEL;
const chromeExecutable = process.env.OBSERVER_CHROMIUM_PATH;

export default defineConfig({
  testDir: "e2e/tests",

  // Generated fixture runs are not committed; (re)create them deterministically
  // before anything reads WATCH_DIR. Idempotent — a no-op when already present.
  globalSetup: path.resolve(__dirname, "e2e/global-setup.ts"),

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: process.env.CI ? 1 : undefined,

  timeout: 120_000,

  reporter: [["html", { open: "never" }]],

  use: {
    baseURL: `http://localhost:${testPort}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      // Suite warm-up (settings-flake root cause): one solo browser pass over
      // the page routes so `next dev` compiles them BEFORE the fully-parallel
      // worker stampede. See e2e/tests/warmup.setup.ts.
      name: "warmup",
      testMatch: /warmup\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        ...(chromeChannel ? { channel: chromeChannel } : {}),
        ...(chromeExecutable
          ? { launchOptions: { executablePath: chromeExecutable } }
          : {}),
      },
    },
    {
      name: "chromium",
      dependencies: ["warmup"],
      use: {
        ...devices["Desktop Chrome"],
        ...(chromeChannel ? { channel: chromeChannel } : {}),
        ...(chromeExecutable
          ? { launchOptions: { executablePath: chromeExecutable } }
          : {}),
      },
    },
  ],

  webServer: {
    command: `node node_modules/next/dist/bin/next dev --port ${testPort}`,
    port: testPort,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      WATCH_DIR: fixtureRunsDir,
      OBSERVER_REGISTRY: path.resolve(__dirname, "e2e/fixtures/.observer-test.json"),
      PORT: String(testPort),
      OBSERVER_STALE_THRESHOLD_MS: "999999999999",
      // UX-R3 wave 3 (in-progress indication): the in-progress "active" window
      // is decoupled from the frozen-open stale window so the months-old static
      // fixtures are NOT falsely marked "live" (they'd all become Working if the
      // active window inherited the 31-year stale window). Pin a realistic 1h
      // window: only a run whose newest journal event is <1h old reads as live.
      OBSERVER_ACTIVE_THRESHOLD_MS: "3600000",
      // Test isolation: serve ONLY the fixture runs, never the real ~/.a5c/runs.
      OBSERVER_WATCH_EXCLUSIVE: "1",
      // Pin a very large retention window so the static fixtures (which carry
      // fixed, months-old timestamps) never age out of listProjectRuns. Without
      // this, completed/failed fixture runs fall outside the default 30-day
      // retention and per-project counts no longer match the fixture manifest.
      OBSERVER_RETENTION_DAYS: "36500",
    },
  },
});
