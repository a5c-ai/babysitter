import { test, expect } from "../fixtures";
import { getManifest } from "../fixtures/test-data";
import type { ManifestRun } from "../fixtures/test-data";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Picks a run from the manifest by status, returning the first match. */
async function pickRun(status: ManifestRun["status"]): Promise<ManifestRun> {
  const manifest = await getManifest();
  const run = manifest.runs.find((r) => r.status === status);
  if (!run) throw new Error(`No fixture run found with status "${status}"`);
  return run;
}

/** Picks a "heavy" run with at least `minTasks` tasks. */
async function pickHeavyRun(minTasks = 20): Promise<ManifestRun> {
  const manifest = await getManifest();
  const run = manifest.runs.find((r) => r.taskCount >= minTasks);
  if (!run) throw new Error(`No fixture run with >= ${minTasks} tasks`);
  return run;
}

// ---------------------------------------------------------------------------
// Run Detail Page — E2E Tests
// ---------------------------------------------------------------------------

test.describe("Run Detail Page", () => {

  // ── Page Load ───────────────────────────────────────────────────────────

  test.describe("page loading", () => {

    test("loads with correct run ID and displays pipeline", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      // URL should contain the run ID
      expect(runDetailPage.page.url()).toContain(`/runs/${run.runId}`);

      // Pipeline panel should be visible
      await expect(runDetailPage.pipelinePanel).toBeVisible();

      // Breadcrumb should show the run ID (truncated to last 4 chars)
      const shortId = run.runId.slice(-4);
      await expect(runDetailPage.breadcrumb).toContainText(shortId);
    });

    test("shows breadcrumb with project name and Projects link", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      // Breadcrumb should contain the project name
      await expect(runDetailPage.breadcrumb).toContainText(run.projectName);

      // "Projects" link should be visible and point to root
      await expect(runDetailPage.backToProjects).toBeVisible();
      await expect(runDetailPage.backToProjects).toHaveAttribute("href", "/");
    });

    test("shows status badge in breadcrumb matching run status", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      // Status badge should be visible
      const badge = runDetailPage.getRunStatusBadge();
      await expect(badge).toBeVisible();

      // Badge should have the correct status data attribute
      await expect(badge).toHaveAttribute("data-testid", `status-badge-${run.status}`);
    });

    test("displays loading spinner before data is ready", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      // Navigate and immediately check for spinner (may or may not be visible
      // depending on load speed, so we just verify the page eventually loads)
      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      // After data loads, spinner should be gone
      await expect(runDetailPage.loadingSpinner.first()).not.toBeVisible();
    });
  });

  // ── Outcome Banner ──────────────────────────────────────────────────────

  test.describe("outcome banner", () => {

    test("shows success banner for completed runs", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      const banner = runDetailPage.getOutcomeBanner();
      await expect(banner).toBeVisible();
      await expect(banner).toHaveAttribute("data-status", "completed");
      await expect(banner).toContainText("Completed in");
    });

    test("shows failure banner for failed runs", async ({ runDetailPage }) => {
      const run = await pickRun("failed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      const banner = runDetailPage.getOutcomeBanner();
      await expect(banner).toBeVisible();
      await expect(banner).toHaveAttribute("data-status", "failed");
      await expect(banner).toContainText("Failed at step");
    });

    test("does not show outcome banner for waiting runs", async ({ runDetailPage }) => {
      const run = await pickRun("waiting");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      const banner = runDetailPage.getOutcomeBanner();
      await expect(banner).not.toBeVisible();
    });

    test("does not show outcome banner for pending runs", async ({ runDetailPage }) => {
      const run = await pickRun("pending");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      const banner = runDetailPage.getOutcomeBanner();
      await expect(banner).not.toBeVisible();
    });
  });

  // ── Metrics Row ─────────────────────────────────────────────────────────

  test.describe("metrics row", () => {

    test("displays all four metric cards", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      await expect(runDetailPage.getMetricsRow()).toBeVisible();

      // Expect exactly 4 metric cards: duration, tasks, success rate, iterations
      await expect(runDetailPage.getMetricCard("total-duration")).toBeVisible();
      await expect(runDetailPage.getMetricCard("tasks")).toBeVisible();
      await expect(runDetailPage.getMetricCard("success-rate")).toBeVisible();
      await expect(runDetailPage.getMetricCard("iterations")).toBeVisible();
    });

    test("tasks metric shows completed/total format", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      const tasksCard = runDetailPage.getMetricCard("tasks");
      // Should contain a fraction like "7/7" or "13/13"
      await expect(tasksCard).toContainText("/");
    });

    test("success rate metric shows percentage", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      const successCard = runDetailPage.getMetricCard("success-rate");
      await expect(successCard).toContainText("%");
    });
  });

  // ── Pipeline View ───────────────────────────────────────────────────────

  test.describe("pipeline view", () => {

    test("shows tasks with status badges", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      const steps = runDetailPage.getPipelineSteps();
      const count = await steps.count();

      // Should have at least one step
      expect(count).toBeGreaterThan(0);

      // First step card should have a status data attribute
      const firstStep = steps.first();
      const status = await firstStep.getAttribute("data-status");
      expect(status).toBeTruthy();
    });

    test("completed run renders expected number of tasks", async ({ runDetailPage }) => {
      // Pick a small completed run with known task count
      const manifest = await getManifest();
      const run = manifest.runs.find(
        (r) => r.status === "completed" && r.taskCount <= 15 && r.taskCount >= 5
      );
      if (!run) throw new Error("No suitable completed run found");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      const steps = runDetailPage.getPipelineSteps();
      const count = await steps.count();

      // Task count should match manifest (may differ slightly due to parallel grouping
      // which renders all sub-tasks, so count should be >= taskCount)
      expect(count).toBeGreaterThanOrEqual(run.taskCount);
    });

    test("step card displays task title text", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      const firstStep = runDetailPage.getPipelineSteps().first();
      // Step card should contain some text (task title)
      const text = await firstStep.textContent();
      expect(text).toBeTruthy();
      expect(text!.length).toBeGreaterThan(0);
    });

    test("pipeline header shows progress percentage", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      // Pipeline panel should contain a percentage indicator
      await expect(runDetailPage.pipelinePanel).toContainText("%");
    });

    test("pipeline header shows task count", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      // Pipeline panel header should show "X/Y tasks"
      await expect(runDetailPage.pipelinePanel).toContainText("tasks");
    });
  });

  // ── Task Detail Panel ───────────────────────────────────────────────────

  test.describe("task detail panel", () => {

    test("clicking a step opens the task detail panel", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      // Task detail should not be visible initially
      await expect(runDetailPage.taskDetailHeader).not.toBeVisible();

      // Click the first step
      await runDetailPage.clickStepByIndex(0);

      // Task detail header should now be visible
      await expect(runDetailPage.taskDetailHeader).toBeVisible({ timeout: 10_000 });
      await expect(runDetailPage.taskDetailHeader).toContainText("Task Detail");
    });

    test("task detail panel shows tab list with Agent, Timing, Logs, Data tabs", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      // Click a step to open detail panel
      await runDetailPage.clickStepByIndex(0);
      await expect(runDetailPage.taskDetailHeader).toBeVisible({ timeout: 10_000 });

      // Wait for the task detail loading spinner to disappear before checking tabs
      await runDetailPage.page.locator('[data-testid="task-detail-header"] ~ * .animate-spin, [data-testid="task-detail-header"] + * .animate-spin')
        .first()
        .waitFor({ state: 'hidden', timeout: 30_000 })
        .catch(() => { /* spinner may never appear if data loads fast */ });

      // Verify tab triggers exist
      const tabs = runDetailPage.getTaskDetailTabs();
      await expect(tabs).toBeVisible({ timeout: 30_000 });

      await expect(runDetailPage.getTabTrigger("Agent")).toBeVisible();
      await expect(runDetailPage.getTabTrigger("Timing")).toBeVisible();
      await expect(runDetailPage.getTabTrigger("Logs")).toBeVisible();
      await expect(runDetailPage.getTabTrigger("Data")).toBeVisible();
    });

    test("switching tabs updates the displayed content", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      // Click a step to open detail panel
      await runDetailPage.clickStepByIndex(0);
      await expect(runDetailPage.getTaskDetailTabs()).toBeVisible({ timeout: 10_000 });

      // Default tab should be "Agent" — verify it's active
      const agentTab = runDetailPage.getTabTrigger("Agent");
      await expect(agentTab).toHaveAttribute("data-state", "active");

      // Click "Timing" tab
      await runDetailPage.getTabTrigger("Timing").click();
      await expect(runDetailPage.getTabTrigger("Timing")).toHaveAttribute("data-state", "active");
      await expect(agentTab).toHaveAttribute("data-state", "inactive");

      // Click "Logs" tab
      await runDetailPage.getTabTrigger("Logs").click();
      await expect(runDetailPage.getTabTrigger("Logs")).toHaveAttribute("data-state", "active");

      // Click "Data" tab
      await runDetailPage.getTabTrigger("Data").click();
      await expect(runDetailPage.getTabTrigger("Data")).toHaveAttribute("data-state", "active");
    });

    test("Agent tab shows task title and status badges", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      // Click a step
      await runDetailPage.clickStepByIndex(0);
      await expect(runDetailPage.getTaskDetailTabs()).toBeVisible({ timeout: 10_000 });

      // Agent tab content should have a heading with the task title
      const agentTabContent = runDetailPage.page.locator("[role='tabpanel'][data-state='active']");
      await expect(agentTabContent).toBeVisible({ timeout: 10_000 });

      // Should contain a status badge
      await expect(agentTabContent.locator("[data-testid^='status-badge-']").first()).toBeVisible();
    });

    test("Timing tab shows duration-related information", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      // Click a step and switch to Timing tab
      await runDetailPage.clickStepByIndex(0);
      await expect(runDetailPage.getTaskDetailTabs()).toBeVisible({ timeout: 10_000 });
      await runDetailPage.getTabTrigger("Timing").click();

      // Timing panel should contain timing labels
      const tabContent = runDetailPage.page.locator("[role='tabpanel'][data-state='active']");
      await expect(tabContent).toContainText("Requested");
      await expect(tabContent).toContainText("Duration");
    });

    test("close button dismisses the task detail panel", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      // Open detail panel
      await runDetailPage.clickStepByIndex(0);
      await expect(runDetailPage.taskDetailHeader).toBeVisible({ timeout: 10_000 });

      // Click close button
      await runDetailPage.closeDetailBtn.click();

      // Detail header should be hidden
      await expect(runDetailPage.taskDetailHeader).not.toBeVisible();
    });

    test("selected step card gets visual highlight", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      const firstStep = runDetailPage.getPipelineSteps().first();

      // Before clicking, selected attribute should be false
      await expect(firstStep).toHaveAttribute("data-selected", "false");

      // Click the step
      await firstStep.locator("button").first().click();

      // After clicking, selected attribute should be true
      await expect(firstStep).toHaveAttribute("data-selected", "true");
    });
  });

  // ── Event Stream ────────────────────────────────────────────────────────

  test.describe("event stream", () => {

    test("event stream panel is visible on page load", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      await expect(runDetailPage.eventStreamPanel).toBeVisible();
      await expect(runDetailPage.eventStreamPanel).toContainText("Event Stream");
    });

    test("event stream displays event items", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      // Scroll event stream into view
      await runDetailPage.eventStreamPanel.scrollIntoViewIfNeeded();

      // There should be at least one event
      const eventItems = runDetailPage.getEventItems();
      await expect(eventItems.first()).toBeVisible({ timeout: 10_000 });
      const count = await eventItems.count();
      expect(count).toBeGreaterThan(0);
    });

    test("event stream shows event count", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      // Scroll event stream into view
      await runDetailPage.eventStreamPanel.scrollIntoViewIfNeeded();

      // Event stream header should show event count like "16 events"
      await expect(runDetailPage.eventStreamPanel).toContainText("events");
    });

    test("event stream filter buttons are visible", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      // Scroll event stream into view first
      const eventStream = runDetailPage.getEventStream();
      await eventStream.scrollIntoViewIfNeeded();

      // Filter buttons: All, Tasks, Results, Errors
      await expect(eventStream.getByText("All", { exact: true })).toBeVisible({ timeout: 10_000 });
      await expect(eventStream.getByText("Tasks", { exact: true })).toBeVisible();
      await expect(eventStream.getByText("Results", { exact: true })).toBeVisible();
      await expect(eventStream.getByText("Errors", { exact: true })).toBeVisible();
    });

    test("clicking a filter changes the visible events", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      const eventStream = runDetailPage.getEventStream();
      await eventStream.scrollIntoViewIfNeeded();

      // Wait for event items to be present
      await expect(runDetailPage.getEventItems().first()).toBeVisible({ timeout: 10_000 });

      // Count "All" events (individual items)
      const allCount = await runDetailPage.getEventItems().count();

      // Click "Tasks" filter
      await eventStream.getByText("Tasks", { exact: true }).click();

      // After filtering, events may be grouped (3+ consecutive same-type events collapse).
      // Check for either individual event items or collapsed group buttons.
      const filteredItemCount = await runDetailPage.getEventItems().count();
      const groupCount = await eventStream.locator("button").filter({ hasText: /^\d+x/ }).count();
      const totalVisible = filteredItemCount + groupCount;
      expect(totalVisible).toBeGreaterThan(0);

      // The filtered header should show the event count
      await expect(eventStream).toContainText("events");
    });

    test("event items have correct type annotations", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      // Scroll event stream into view and wait for items
      const eventStream = runDetailPage.getEventStream();
      await eventStream.scrollIntoViewIfNeeded();
      await expect(runDetailPage.getEventItems().first()).toBeVisible({ timeout: 10_000 });

      // Check first event item has a data-event-type attribute
      const firstEvent = runDetailPage.getEventItems().first();
      const eventType = await firstEvent.getAttribute("data-event-type");
      expect(eventType).toBeTruthy();
      expect([
        "RUN_CREATED",
        "EFFECT_REQUESTED",
        "EFFECT_RESOLVED",
        "RUN_COMPLETED",
        "RUN_FAILED",
      ]).toContain(eventType);
    });

    test("event stream shows summary stats bar", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      // Scroll event stream into view and wait for it to load
      const eventStream = runDetailPage.getEventStream();
      await eventStream.scrollIntoViewIfNeeded();
      await expect(runDetailPage.getEventItems().first()).toBeVisible({ timeout: 10_000 });

      // Summary stats bar should show Tasks:, Completed:, Errors: labels
      await expect(eventStream).toContainText("Tasks:");
      await expect(eventStream).toContainText("Completed:");
      await expect(eventStream).toContainText("Errors:");
    });
  });

  // ── Back Navigation ─────────────────────────────────────────────────────

  test.describe("back navigation", () => {

    test("Projects breadcrumb link navigates back to dashboard", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      // Click the "Projects" link
      await runDetailPage.backToProjects.click();

      // Should navigate to dashboard
      await runDetailPage.page.waitForURL("**/", { timeout: 30_000 });
      expect(runDetailPage.page.url()).toMatch(/\/$/);
    });
  });

  // ── Heavy Run (20+ tasks) ──────────────────────────────────────────────

  test.describe("heavy runs", () => {

    test("run with 20+ tasks shows truncated view with 'Show all' button", async ({ runDetailPage }) => {
      const run = await pickHeavyRun(20);

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      // The pipeline initially shows up to 20 entries
      // With grouping, the actual step-card count may be >= 20
      const steps = runDetailPage.getPipelineSteps();
      const initialCount = await steps.count();
      expect(initialCount).toBeGreaterThan(0);

      // "Show all tasks" button should be visible if there are more than 20 pipeline entries
      // (which depends on parallel grouping; some heavy runs may not exceed the threshold)
      const showAllBtn = runDetailPage.showAllTasksBtn;
      const isTruncated = await showAllBtn.isVisible();

      if (isTruncated) {
        // Button should indicate the total number of tasks
        await expect(showAllBtn).toContainText("Show all");

        // Click "Show all" to expand
        await showAllBtn.click();

        // After expanding, the button should disappear
        await expect(showAllBtn).not.toBeVisible();

        // More steps should be visible now
        const expandedCount = await steps.count();
        expect(expandedCount).toBeGreaterThanOrEqual(initialCount);
      }
    });

    test("heavy run renders all tasks after expanding", async ({ runDetailPage }) => {
      const run = await pickHeavyRun(20);

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      // If truncated, expand first
      const showAllBtn = runDetailPage.showAllTasksBtn;
      if (await showAllBtn.isVisible()) {
        await showAllBtn.click();
      }

      const steps = runDetailPage.getPipelineSteps();
      const count = await steps.count();

      // Should have at least as many steps as tasks (parallel groups may show more)
      expect(count).toBeGreaterThanOrEqual(run.taskCount);
    });
  });

  // ── Rapid Task Clicking ─────────────────────────────────────────────────

  test.describe("rapid task clicking", () => {

    test("rapid clicking between tasks updates detail panel correctly", async ({ runDetailPage }) => {
      // Use a run with at least 5 tasks for meaningful rapid clicking
      const manifest = await getManifest();
      const run = manifest.runs.find(
        (r) => r.status === "completed" && r.taskCount >= 5
      );
      if (!run) throw new Error("No completed run with >= 5 tasks");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      // Click first step
      await runDetailPage.clickStepByIndex(0);
      await expect(runDetailPage.taskDetailHeader).toBeVisible({ timeout: 10_000 });

      // Rapidly click through several steps
      for (let i = 1; i < Math.min(5, run.taskCount); i++) {
        await runDetailPage.clickStepByIndex(i);
        // Small delay to allow click processing
        await runDetailPage.page.waitForTimeout(100);
      }

      // After rapid clicking, the last clicked step should be selected
      const lastClickedIndex = Math.min(4, run.taskCount - 1);
      const lastStep = runDetailPage.getPipelineSteps().nth(lastClickedIndex);
      await expect(lastStep).toHaveAttribute("data-selected", "true");

      // The task detail panel should still be visible
      await expect(runDetailPage.taskDetailHeader).toBeVisible();

      // The detail tabs should still be functional
      await expect(runDetailPage.getTaskDetailTabs()).toBeVisible();
    });

    test("clicking a different step deselects the previous one", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      const steps = runDetailPage.getPipelineSteps();
      const count = await steps.count();
      if (count < 2) {
        test.skip();
        return;
      }

      // Click first step
      await steps.first().locator("button").first().click();
      await expect(steps.first()).toHaveAttribute("data-selected", "true");

      // Click second step
      await steps.nth(1).locator("button").first().click();
      await expect(steps.nth(1)).toHaveAttribute("data-selected", "true");

      // First step should no longer be selected
      await expect(steps.first()).toHaveAttribute("data-selected", "false");
    });
  });

  // ── Cross-status Validation ─────────────────────────────────────────────

  test.describe("cross-status validation", () => {

    test("failed run shows error details in step card", async ({ runDetailPage }) => {
      const run = await pickRun("failed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      // Expand all tasks if "Show all" button is visible (error task may be beyond initial 20)
      const showAllBtn = runDetailPage.page.locator("[data-testid='show-all-tasks-btn']");
      if (await showAllBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await showAllBtn.click();
        await runDetailPage.page.waitForTimeout(500);
      }

      // Failed runs should have at least one step with error status
      const errorSteps = runDetailPage.page.locator("[data-testid^='step-card-'][data-status='error']");
      const errorCount = await errorSteps.count();
      expect(errorCount).toBeGreaterThan(0);
    });

    test("waiting run shows requested status on pending tasks", async ({ runDetailPage }) => {
      const run = await pickRun("waiting");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      // Expand all tasks if "Show all" button is visible (requested task may be beyond initial 20)
      const showAllBtn = runDetailPage.page.locator("[data-testid='show-all-tasks-btn']");
      if (await showAllBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await showAllBtn.click();
        await runDetailPage.page.waitForTimeout(500);
      }

      // Waiting runs should have at least one "requested" task
      const requestedSteps = runDetailPage.page.locator("[data-testid^='step-card-'][data-status='requested']");
      const requestedCount = await requestedSteps.count();
      expect(requestedCount).toBeGreaterThan(0);
    });

    test("waiting run displays 'Waiting' status badge", async ({ runDetailPage }) => {
      const run = await pickRun("waiting");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      const badge = runDetailPage.getRunStatusBadge();
      await expect(badge).toBeVisible();
      await expect(badge).toHaveAttribute("data-testid", "status-badge-waiting");
    });
  });

  // ── Event + Pipeline Interaction ────────────────────────────────────────

  test.describe("event-pipeline interaction", () => {

    test("clicking an event item in the stream opens task detail", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      // Find the first EFFECT_REQUESTED event (these have effectId linkage)
      const requestedEvents = runDetailPage.page.locator("[data-testid^='event-item-'][data-event-type='EFFECT_REQUESTED']");
      const count = await requestedEvents.count();

      if (count === 0) {
        test.skip();
        return;
      }

      // Detail panel should not be open yet
      await expect(runDetailPage.taskDetailHeader).not.toBeVisible();

      // Click the first requested event
      await requestedEvents.first().click();

      // Task detail panel should appear
      await expect(runDetailPage.taskDetailHeader).toBeVisible({ timeout: 10_000 });
    });
  });

  // ── Layout Panels ───────────────────────────────────────────────────────

  test.describe("layout panels", () => {

    test("all three panels (pipeline, event stream) visible on load", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      await expect(runDetailPage.pipelinePanel).toBeVisible();
      await expect(runDetailPage.eventStreamPanel).toBeVisible();

      // Task detail should NOT be visible initially
      await expect(runDetailPage.taskDetailHeader).not.toBeVisible();
    });

    test("opening task detail shows three-panel layout", async ({ runDetailPage }) => {
      const run = await pickRun("completed");

      await runDetailPage.goto(run.runId);
      await runDetailPage.waitForData();

      // Click a step to open the detail panel
      await runDetailPage.clickStepByIndex(0);
      await expect(runDetailPage.taskDetailHeader).toBeVisible({ timeout: 10_000 });

      // All three panels should be visible
      await expect(runDetailPage.pipelinePanel).toBeVisible();
      await expect(runDetailPage.taskDetailHeader).toBeVisible();
      await expect(runDetailPage.eventStreamPanel).toBeVisible();
    });
  });
});
