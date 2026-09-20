/**
 * Captures a screenshot of the run detail page for the README.
 * Temporarily patches a fixture's projectName to "babysitter-observer-dashboard".
 *
 * Usage: npx tsx scripts/capture-run-detail.ts
 */
import { chromium } from "playwright";
import path from "path";
import { promises as fs } from "fs";
import { spawn, type ChildProcess } from "child_process";

// Best fixture run: 25 completed tasks, 100% success, 14m duration
const TARGET_RUN_ID = "01KH6HKNFCXVSH1PYG9PWXSTDD";
const DESIRED_PROJECT_NAME = "babysitter-observer-dashboard";
const PORT = 4199;
const FIXTURE_DIR = path.resolve(__dirname, "../e2e/fixtures/runs");
const REGISTRY = path.resolve(__dirname, "../e2e/fixtures/.observer-test.json");
const OUTPUT_PATH = path.resolve(__dirname, "../docs/dashboard-run-detail-dark.png");

const RUN_JSON_PATH = path.join(FIXTURE_DIR, TARGET_RUN_ID, "run.json");

function startServer(): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const server = spawn(
      "node",
      ["node_modules/next/dist/bin/next", "dev", "--port", String(PORT)],
      {
        cwd: path.resolve(__dirname, ".."),
        env: {
          ...process.env,
          WATCH_DIR: FIXTURE_DIR,
          PORT: String(PORT),
          OBSERVER_STALE_THRESHOLD_MS: "999999999999",
          OBSERVER_REGISTRY: REGISTRY,
        },
        stdio: "pipe",
      }
    );

    const timeout = setTimeout(() => reject(new Error("Server start timeout")), 60_000);
    server.stdout?.on("data", (data: Buffer) => {
      const text = data.toString();
      if (text.includes("Ready") || text.includes(`localhost:${PORT}`)) {
        clearTimeout(timeout);
        resolve(server);
      }
    });
    server.stderr?.on("data", () => {});
    server.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function main() {
  // Step 1: Temporarily patch the fixture's projectName
  const originalContent = await fs.readFile(RUN_JSON_PATH, "utf-8");
  const runJson = JSON.parse(originalContent);
  const originalProjectName = runJson.projectName;
  console.log(`Patching projectName: "${originalProjectName}" -> "${DESIRED_PROJECT_NAME}"`);
  runJson.projectName = DESIRED_PROJECT_NAME;
  await fs.writeFile(RUN_JSON_PATH, JSON.stringify(runJson, null, 2));

  let server: ChildProcess | null = null;

  try {
    // Step 2: Start the dev server
    console.log("Starting Next.js dev server on port", PORT, "...");
    server = await startServer();
    console.log("Server ready. Launching browser...");

    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      colorScheme: "dark",
    });
    const page = await context.newPage();

    // Warm up
    console.log("Loading homepage...");
    await page.goto(`http://localhost:${PORT}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(10000);

    // Navigate to run detail
    const url = `http://localhost:${PORT}/runs/${TARGET_RUN_ID}`;
    console.log("Navigating to", url);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(8000);

    // Click the first pipeline step to expand task detail (matching user's photo)
    try {
      const taskSelectors = [
        '[data-testid="pipeline-step"]',
        '.pipeline-step',
        '[class*="step-card"]',
        '[class*="task-card"]',
      ];
      for (const selector of taskSelectors) {
        const el = page.locator(selector).first();
        if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log("Clicking task:", selector);
          await el.click();
          await page.waitForTimeout(2000);
          break;
        }
      }
    } catch {
      console.log("Could not click task, continuing with default view");
    }

    // Take screenshot
    console.log("Taking screenshot...");
    await page.screenshot({
      path: OUTPUT_PATH,
      fullPage: false,
    });
    console.log("Screenshot saved to", OUTPUT_PATH);

    await browser.close();
  } finally {
    // Step 3: Always restore the original content
    console.log(`Restoring projectName: "${originalProjectName}"`);
    await fs.writeFile(RUN_JSON_PATH, originalContent);

    if (server) server.kill();
  }

  process.exit(0);
}

main().catch(async (err) => {
  // Also restore on error
  try {
    const originalContent = await fs.readFile(RUN_JSON_PATH, "utf-8");
    const runJson = JSON.parse(originalContent);
    if (runJson.projectName === DESIRED_PROJECT_NAME) {
      runJson.projectName = "sales-pipeline";
      await fs.writeFile(RUN_JSON_PATH, JSON.stringify(runJson, null, 2));
    }
  } catch {}
  console.error("Error:", err);
  process.exit(1);
});
