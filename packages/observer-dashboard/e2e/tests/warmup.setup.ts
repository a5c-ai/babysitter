import { test, expect } from "@playwright/test";

/**
 * Suite warm-up — runs as a dependency project BEFORE the parallel suite.
 *
 * Root cause of the settings-modal flake class: the e2e webServer is
 * `next dev`, which compiles routes on first hit. With a fully-parallel
 * worker pool stampeding a COLD server, first-compiles of the dashboard and
 * run-detail routes contend on one CPU-heavy compiler, individual steps
 * (goto/waitForData/click) each crawl, and per-test budgets drain until a
 * late assertion (e.g. settings modal visible) times out.
 *
 * Visiting the two page routes once, alone, moves every compile out of the
 * contended window — afterwards the workers only hit warm caches. This is a
 * warm-up, not a timeout bump: no test budget changed.
 */

// Static fixture that always exists (shared read-only breakpoint fixture).
const WARMUP_RUN_ID = "01KTESTPENDINGBPFIXTURE0";

test("warm up dev-server route compiles before the parallel suite", async ({ page }) => {
  // Generous budget for the two cold compiles — spent once per suite, alone.
  test.setTimeout(180_000);

  // Dashboard root: compiles the app shell + board bundle and its API routes
  // (/api/runs, /api/projects, /api/stream are requested by the page itself).
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("header")).toBeVisible({ timeout: 120_000 });

  // Run detail: the other page route the suite hammers.
  await page.goto(`/runs/${WARMUP_RUN_ID}`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("header")).toBeVisible({ timeout: 120_000 });
});
