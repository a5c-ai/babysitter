import { test, expect } from "../fixtures";
import { getManifest, getRunIdsByStatus, getActiveRunCount } from "../fixtures/test-data";
import type { Manifest, ManifestRun } from "../fixtures/test-data";

/**
 * E2E tests for the Breakpoint Panel and Breakpoint Banner.
 *
 * These tests validate that:
 * - The breakpoint banner renders conditionally based on pending breakpoints
 * - Navigating to a run with a breakpoint task shows the Approval tab
 * - The breakpoint panel displays question/context text
 * - The Approval tab is the default tab for breakpoint-kind tasks
 * - Non-breakpoint tasks do not show the Approval tab
 *
 * Note: The fixture data contains waiting runs with RESOLVED breakpoints
 * (the breakpoint task was approved before the run continued to the next step,
 * which is still pending). The banner only appears when breakpoints are still
 * pending, so we verify it is absent with the current fixture data.
 */

let manifest: Manifest;

test.beforeAll(async () => {
  manifest = await getManifest();
});

/** Pick a run from the manifest by status. */
function pickRun(status: ManifestRun["status"]): ManifestRun {
  const run = manifest.runs.find((r) => r.status === status);
  if (!run) throw new Error(`No fixture run found with status "${status}"`);
  return run;
}

/**
 * Known waiting run with a resolved breakpoint task.
 *
 * Run 01KH47FK2MGMMB37B17PE3Z91Z (sample/roster-update) has a breakpoint
 * task "Approve budget allocation?" at effectId 01KH47YK0HJ1CY5FYT4X1XZ5YZ.
 * The breakpoint was already resolved (approved), but the run is still in
 * "waiting" status because a subsequent agent task is pending.
 */
const BREAKPOINT_RUN_ID = "01KH47FK2MGMMB37B17PE3Z91Z";
const BREAKPOINT_EFFECT_ID = "01KH47YK0HJ1CY5FYT4X1XZ5YZ";

/**
 * Fixture run with a PENDING (unresolved) breakpoint task.
 *
 * Run 01KTESTPENDINGBPFIXTURE0 (test-breakpoint-project) has:
 * - 1 completed agent task
 * - 1 pending breakpoint task "Approve deployment to staging?"
 *   at effectId 01KTEST_BP_EFFECT_001 (no result.json)
 *
 * This fixture was created to close a gap in E2E coverage: prior to v0.12.3,
 * all fixture breakpoint tasks were resolved, so the breakpoint banner and
 * approval form were never tested in E2E.
 */
const PENDING_BP_RUN_ID = "01KTESTPENDINGBPFIXTURE0";
const PENDING_BP_EFFECT_ID = "01KTEST_BP_EFFECT_001";

// ---------------------------------------------------------------------------
// Needs-you alarm surface on the dashboard
//
// owner 2026-07-07: deduped needs-you surface — top list removed; alarm =
// counts banner + kanban column. The redundant top inform-only list
// (BreakpointBanner) was removed. The slim ExecutiveSummaryBanner counts
// ("N approvals need your attention") is the view-independent alarm; the
// per-run question/project/answer affordances live on the kanban Needs-you
// column card (covered by kanban-board.spec.ts). These tests target the
// surviving surfaces reachable from each view.
// ---------------------------------------------------------------------------

test.describe("Needs-you alarm surface", () => {
  test("counts banner surfaces pending breakpoints on the dashboard", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForData();

    // The fixture includes 01KTESTPENDINGBPFIXTURE0 (unresolved breakpoint), so
    // the counts banner raises the approvals alarm. The slim banner shows counts
    // only — the question/project text now lives on the kanban Needs-you card.
    const banner = page.getByTestId("executive-summary-banner");
    await expect(banner).toBeVisible({ timeout: 15_000 });

    // The approvals segment names the pending-breakpoint count and is the
    // clickable route into the needs-you surface.
    const attention = page.getByTestId("summary-segment-attention");
    await expect(attention).toBeVisible();
    await expect(attention).toContainText(/approval/i);
    await expect(attention).toContainText(/your attention/i);
  });

  test("counts banner stays stable during polling cycles (no flickering)", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForData();

    const banner = page.getByTestId("executive-summary-banner");
    await expect(banner).toBeVisible({ timeout: 15_000 });

    // Verify the banner stays visible across multiple polling cycles.
    // The poll interval in test config is 2000ms. We check every second
    // for 8 seconds to ensure the alarm doesn't flicker.
    for (let i = 0; i < 8; i++) {
      await page.waitForTimeout(1000);
      await expect(banner).toBeVisible({ timeout: 2_000 });
      await expect(page.getByTestId("summary-segment-attention")).toBeVisible();
    }
  });

  test("counts banner shows the approvals alarm alongside active-run metrics", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForData();

    // Verify the counts banner is raising the pending-breakpoint alarm.
    await expect(page.getByTestId("executive-summary-banner")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("summary-segment-attention")).toContainText(/approval/i);

    // The dashboard still shows In Progress runs correctly
    const activeTile = dashboardPage.getMetricTile("active");
    await expect(activeTile).toBeVisible();

    // §15.1 (owner gate 2026-07-06b, scheduled-state): Active = waiting + pending
    // MINUS sleeping "scheduled" runs (a forever-run parked at an unresolved
    // sleep effect is idle-healthy, not in-progress). getActiveRunCount matches
    // the tile's single-counting-source definition.
    const activeCount = await getActiveRunCount();
    await expect(activeTile).toContainText(String(activeCount));
  });

  test("kanban Needs-you card links to the correct run detail page", async ({
    page,
  }) => {
    // owner 2026-07-07: deduped needs-you surface — the per-run "open this run"
    // affordance the removed top list carried now lives on the kanban Needs-you
    // card, so this drives the surviving surface. Board is the default view; a
    // fresh context has no persisted view seed, so a plain goto renders it.
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("kanban-board")).toBeVisible({ timeout: 30_000 });

    // The pending-breakpoint run is a Needs-you card; its stretched overlay link
    // opens the run detail page.
    const card = page
      .getByTestId("kanban-column-needsyou")
      .locator(`[data-run-id="${PENDING_BP_RUN_ID}"]`);
    await expect(card).toBeVisible({ timeout: 15_000 });

    const cardLink = card.getByTestId("kanban-card-link");
    await expect(cardLink).toHaveAttribute("href", `/runs/${PENDING_BP_RUN_ID}`);
    // The stretched overlay link (z-0) is covered in the card's center by the
    // inline breakpoint answer panel (z-10, RunRow pattern). Click near the
    // card's top-left (Row 1) where the link is unobstructed.
    await cardLink.click({ position: { x: 6, y: 6 } });

    // Should navigate to the run detail page
    await page.waitForURL(`**/runs/${PENDING_BP_RUN_ID}`, { timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Breakpoint Panel in Run Detail
// ---------------------------------------------------------------------------

test.describe("Breakpoint Panel", () => {
  test("navigating to a waiting run shows the breakpoint panel in task detail", async ({
    runDetailPage,
  }) => {
    await runDetailPage.goto(BREAKPOINT_RUN_ID);
    await runDetailPage.waitForData();

    // Expand all tasks if "Show all" is visible, since the breakpoint task
    // may be beyond the initial truncated view (22 tasks in this run)
    const showAllBtn = runDetailPage.page.locator("[data-testid='show-all-tasks-btn']");
    if (await showAllBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await showAllBtn.click();
      await runDetailPage.page.waitForTimeout(500);
    }

    // Click the specific breakpoint step card by its effectId
    const breakpointStep = runDetailPage.getStepCard(BREAKPOINT_EFFECT_ID);
    await expect(breakpointStep).toBeVisible({ timeout: 10_000 });
    await breakpointStep.locator("button").first().click();

    // The task detail panel should appear
    await expect(runDetailPage.taskDetailHeader).toBeVisible({ timeout: 10_000 });

    // The "Approval" tab should be visible (only shown for breakpoint tasks)
    const approvalTab = runDetailPage.getTabTrigger("Approval");
    await expect(approvalTab).toBeVisible({ timeout: 10_000 });

    // The Approval tab should be active by default for breakpoint tasks
    await expect(approvalTab).toHaveAttribute("data-state", "active");

    // The breakpoint panel should be rendered
    const breakpointPanel = runDetailPage.page.getByTestId("breakpoint-panel");
    await expect(breakpointPanel).toBeVisible({ timeout: 10_000 });
  });

  test("breakpoint panel displays the question/context text", async ({
    runDetailPage,
  }) => {
    await runDetailPage.goto(BREAKPOINT_RUN_ID);
    await runDetailPage.waitForData();

    // Expand all tasks if needed
    const showAllBtn = runDetailPage.page.locator("[data-testid='show-all-tasks-btn']");
    if (await showAllBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await showAllBtn.click();
      await runDetailPage.page.waitForTimeout(500);
    }

    // Click the breakpoint step card
    const breakpointStep = runDetailPage.getStepCard(BREAKPOINT_EFFECT_ID);
    await breakpointStep.locator("button").first().click();
    await expect(runDetailPage.taskDetailHeader).toBeVisible({ timeout: 10_000 });

    // Wait for the breakpoint panel to load
    const breakpointPanel = runDetailPage.page.getByTestId("breakpoint-panel");
    await expect(breakpointPanel).toBeVisible({ timeout: 10_000 });

    // The breakpoint question text should be visible
    const questionEl = runDetailPage.page.getByTestId("breakpoint-question");
    await expect(questionEl).toBeVisible();

    // The question text should contain the expected question
    // (from the task.json: "Approve budget allocation?")
    const questionText = await questionEl.textContent();
    expect(questionText).toBeTruthy();
    expect(questionText!.length).toBeGreaterThan(0);

    // This breakpoint was already resolved, so the panel should show
    // "Decision made" instead of "Awaiting decision"
    await expect(breakpointPanel).toContainText("Decision made");
  });

  test("breakpoint panel is shown on the Approval tab for breakpoint tasks", async ({
    runDetailPage,
  }) => {
    await runDetailPage.goto(BREAKPOINT_RUN_ID);
    await runDetailPage.waitForData();

    // Expand all tasks if needed
    const showAllBtn = runDetailPage.page.locator("[data-testid='show-all-tasks-btn']");
    if (await showAllBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await showAllBtn.click();
      await runDetailPage.page.waitForTimeout(500);
    }

    // Click the breakpoint step card
    const breakpointStep = runDetailPage.getStepCard(BREAKPOINT_EFFECT_ID);
    await breakpointStep.locator("button").first().click();
    await expect(runDetailPage.taskDetailHeader).toBeVisible({ timeout: 10_000 });

    // The tabs should include Approval for breakpoint tasks
    const tabs = runDetailPage.getTaskDetailTabs();
    await expect(tabs).toBeVisible({ timeout: 10_000 });

    // Verify Approval tab exists alongside other standard tabs
    const approvalTab = runDetailPage.getTabTrigger("Approval");
    await expect(approvalTab).toBeVisible();

    // Standard tabs should also be present
    await expect(runDetailPage.getTabTrigger("Agent")).toBeVisible();
    await expect(runDetailPage.getTabTrigger("Timing")).toBeVisible();
    await expect(runDetailPage.getTabTrigger("Logs")).toBeVisible();
    await expect(runDetailPage.getTabTrigger("Data")).toBeVisible();

    // Approval tab should be active (default for breakpoint tasks)
    await expect(approvalTab).toHaveAttribute("data-state", "active");

    // Breakpoint panel should be visible within the Approval tab content
    await expect(runDetailPage.page.getByTestId("breakpoint-panel")).toBeVisible();

    // The panel should show a "Breakpoint" badge
    await expect(
      runDetailPage.page.getByTestId("breakpoint-panel").getByText("Breakpoint", { exact: true })
    ).toBeVisible();
  });

  test("pending breakpoint shows approval form with 'Awaiting decision' state", async ({
    runDetailPage,
  }) => {
    await runDetailPage.goto(PENDING_BP_RUN_ID);
    await runDetailPage.waitForData();

    // Click the breakpoint step card
    const breakpointStep = runDetailPage.getStepCard(PENDING_BP_EFFECT_ID);
    await expect(breakpointStep).toBeVisible({ timeout: 10_000 });
    await breakpointStep.locator("button").first().click();

    // The task detail panel should appear
    await expect(runDetailPage.taskDetailHeader).toBeVisible({ timeout: 10_000 });

    // The Approval tab should be active by default
    const approvalTab = runDetailPage.getTabTrigger("Approval");
    await expect(approvalTab).toBeVisible({ timeout: 10_000 });
    await expect(approvalTab).toHaveAttribute("data-state", "active");

    // The breakpoint panel should show "Awaiting decision" (not "Decision made")
    const breakpointPanel = runDetailPage.page.getByTestId("breakpoint-panel");
    await expect(breakpointPanel).toBeVisible({ timeout: 10_000 });
    await expect(breakpointPanel).toContainText("Awaiting decision");

    // The question text should be visible
    const questionEl = runDetailPage.page.getByTestId("breakpoint-question");
    await expect(questionEl).toContainText("Approve deployment to staging?");

    // The approval form should be visible (only for pending breakpoints)
    const approvalForm = runDetailPage.page.getByTestId("breakpoint-approval");
    await expect(approvalForm).toBeVisible();

    // The custom answer input should be available
    const customInput = runDetailPage.page.getByTestId("custom-answer-input");
    await expect(customInput).toBeVisible();
  });

  test("pending breakpoint panel remains stable during polling (no flickering)", async ({
    runDetailPage,
  }) => {
    await runDetailPage.goto(PENDING_BP_RUN_ID);
    await runDetailPage.waitForData();

    // Click the breakpoint step card
    const breakpointStep = runDetailPage.getStepCard(PENDING_BP_EFFECT_ID);
    await expect(breakpointStep).toBeVisible({ timeout: 10_000 });
    await breakpointStep.locator("button").first().click();

    const breakpointPanel = runDetailPage.page.getByTestId("breakpoint-panel");
    await expect(breakpointPanel).toBeVisible({ timeout: 10_000 });

    // Verify stability over multiple polling cycles (3s poll interval for active runs)
    for (let i = 0; i < 6; i++) {
      await runDetailPage.page.waitForTimeout(1000);
      await expect(breakpointPanel).toBeVisible({ timeout: 2_000 });
      await expect(breakpointPanel).toContainText("Awaiting decision");
    }
  });

  test("completed runs do not show breakpoint or Approval tab", async ({
    runDetailPage,
  }) => {
    const run = pickRun("completed");

    await runDetailPage.goto(run.runId);
    await runDetailPage.waitForData();

    // Click the first step to open the task detail panel
    await runDetailPage.clickStepByIndex(0);
    await expect(runDetailPage.taskDetailHeader).toBeVisible({ timeout: 10_000 });

    // Wait for the task detail tabs to be visible
    const tabs = runDetailPage.getTaskDetailTabs();
    await expect(tabs).toBeVisible({ timeout: 30_000 });

    // The Approval tab should NOT be visible for non-breakpoint tasks
    const approvalTab = runDetailPage.getTabTrigger("Approval");
    await expect(approvalTab).not.toBeVisible();

    // The breakpoint panel should not be visible
    await expect(
      runDetailPage.page.getByTestId("breakpoint-panel")
    ).not.toBeVisible();
  });
});
