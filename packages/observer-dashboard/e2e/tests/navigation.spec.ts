import { test, expect } from "../fixtures";

/**
 * Navigation E2E tests for the Observer dashboard.
 *
 * Covers user journeys between the Dashboard (/) and Run Detail (/runs/[runId])
 * pages, including filter interactions, direct URL access, error states,
 * rapid navigation, and browser refresh resilience.
 */

/* ─── Known fixture run IDs from _manifest.json ─── */
const COMPLETED_RUN_ID = "01KH507H054PWCPV0ZM3AAMM5J"; // content/draft-review, completed, 7 tasks
const FAILED_RUN_ID = "01KH45VA2ZEEE8XDMEVMKCGA35"; // podcast-intel/publish, failed, 24 tasks
const WAITING_RUN_ID = "01KH47FK2MGMMB37B17PE3Z91Z"; // hockey/roster-update, waiting, 22 tasks
const SECOND_COMPLETED_RUN_ID = "01KH6HKNFCXVSH1PYG9PWXSTDD"; // sales/lead-scoring, completed, 25 tasks
const THIRD_COMPLETED_RUN_ID = "01KH8J6PXYQ8S3WTH4MH1YSSD2"; // podcast-intel/publish, completed, 13 tasks
const NON_EXISTENT_RUN_ID = "01ZZZZZZZZZZZZZZZZZZZZZZZZ";

test.describe("Navigation: Dashboard -> Run Detail -> Dashboard", () => {
  test("full user journey: dashboard -> click run -> run detail -> back to dashboard", async ({
    dashboardPage,
    runDetailPage,
  }) => {
    test.slow(); // This test loads 3 pages sequentially; triple the timeout
    // 1. Start at the dashboard
    await dashboardPage.goto();
    await dashboardPage.waitForData();

    // Verify dashboard content is loaded
    const projectCards = dashboardPage.getProjectCards();
    await expect(projectCards.first()).toBeVisible({ timeout: 30_000 });

    // 2. Expand a project card to reveal run cards
    await projectCards.first().locator("button").first().click();

    // 2b. Expand collapsed sub-sections (Failed Runs, Completed History) if present
    await dashboardPage.expandRunSubSections();

    // 3. Wait for run cards to appear, then click the first one
    const runCards = dashboardPage.getRunCards();
    await expect(runCards.first()).toBeVisible({ timeout: 15_000 });

    // Capture the run ID from the href for verification
    const href = await runCards.first().getAttribute("href");
    const clickedRunId = href?.replace("/runs/", "");
    await runCards.first().click();

    // 4. Verify we landed on the run detail page
    await runDetailPage.waitForData();
    await expect(runDetailPage.page).toHaveURL(new RegExp(`/runs/${clickedRunId}`));

    // Verify the breadcrumb "Projects" link is visible
    await expect(runDetailPage.backToProjects).toBeVisible();

    // 5. Navigate back to the dashboard via breadcrumb
    await runDetailPage.backToProjects.click();

    // 6. Verify we are back on the dashboard
    await expect(dashboardPage.heading).toBeVisible({ timeout: 30_000 });
    await dashboardPage.waitForData();
    await expect(projectCards.first()).toBeVisible();
  });

  test("filter by failed status, expand project, click filtered run, verify detail page", async ({
    dashboardPage,
    runDetailPage,
  }) => {
    // 1. Load dashboard
    await dashboardPage.goto();
    await dashboardPage.waitForData();

    // 2. Click the "Failed" filter pill
    await dashboardPage.clickFilter("Failed");

    // 3. Verify filtered projects are shown (projects with failed runs)
    const projectCards = dashboardPage.getProjectCards();
    await expect(projectCards.first()).toBeVisible({ timeout: 15_000 });

    // 4. Expand the first project card to see runs
    await projectCards.first().locator("button").first().click();

    // 4b. Expand collapsed sub-sections (Failed Runs, Completed History) if present
    await dashboardPage.expandRunSubSections();

    // 5. Wait for run cards and click the first visible one
    const runCards = dashboardPage.getRunCards();
    await expect(runCards.first()).toBeVisible({ timeout: 15_000 });
    await runCards.first().click();

    // 6. Verify run detail page loads
    await runDetailPage.waitForData();
    await expect(runDetailPage.page).toHaveURL(/\/runs\//);

    // Verify run detail content is present (breadcrumb nav indicates pipeline loaded)
    await expect(runDetailPage.breadcrumb).toBeVisible();
  });

  test("filter by completed status, expand project, click run, verify detail", async ({
    dashboardPage,
    runDetailPage,
  }) => {
    // 1. Load dashboard
    await dashboardPage.goto();
    await dashboardPage.waitForData();

    // 2. Click the "Completed" filter pill
    await dashboardPage.clickFilter("Completed");

    // 3. Expand first project card
    const projectCards = dashboardPage.getProjectCards();
    await expect(projectCards.first()).toBeVisible({ timeout: 15_000 });
    await projectCards.first().locator("button").first().click();

    // 3b. Expand collapsed sub-sections (Failed Runs, Completed History) if present
    await dashboardPage.expandRunSubSections();

    // 4. Click first run card
    const runCards = dashboardPage.getRunCards();
    await expect(runCards.first()).toBeVisible({ timeout: 15_000 });
    await runCards.first().click();

    // 5. Verify run detail page loaded successfully
    await runDetailPage.waitForData();
    await expect(runDetailPage.page).toHaveURL(/\/runs\//);
    await expect(runDetailPage.breadcrumb).toBeVisible();
  });
});

test.describe("Navigation: Direct URL access", () => {
  test("direct URL to a completed run loads correctly", async ({ runDetailPage }) => {
    await runDetailPage.goto(COMPLETED_RUN_ID);
    await runDetailPage.waitForData();

    // Verify the page loaded with run content
    await expect(runDetailPage.page).toHaveURL(`/runs/${COMPLETED_RUN_ID}`);
    await expect(runDetailPage.breadcrumb).toBeVisible();
    await expect(runDetailPage.backToProjects).toBeVisible();
  });

  test("direct URL to a failed run loads correctly", async ({ runDetailPage }) => {
    await runDetailPage.goto(FAILED_RUN_ID);
    await runDetailPage.waitForData();

    await expect(runDetailPage.page).toHaveURL(`/runs/${FAILED_RUN_ID}`);
    await expect(runDetailPage.breadcrumb).toBeVisible();
  });

  test("direct URL to a waiting run loads correctly", async ({ runDetailPage }) => {
    await runDetailPage.goto(WAITING_RUN_ID);
    await runDetailPage.waitForData();

    await expect(runDetailPage.page).toHaveURL(`/runs/${WAITING_RUN_ID}`);
    await expect(runDetailPage.breadcrumb).toBeVisible();
  });

  test("navigate to a non-existent run shows error state", async ({ runDetailPage }) => {
    await runDetailPage.goto(NON_EXISTENT_RUN_ID);

    // Wait for loading to complete - the page should show an error or "Run not found"
    await runDetailPage.loadingSpinner
      .first()
      .waitFor({ state: "hidden", timeout: 30_000 })
      .catch(() => {
        // Spinner may never appear if error returns immediately
      });

    // The error message should be visible
    await expect(runDetailPage.errorMessage).toBeVisible({ timeout: 30_000 });
  });
});

test.describe("Navigation: Rapid navigation between runs", () => {
  test("rapidly clicking multiple runs settles on the last clicked run", async ({
    dashboardPage,
    runDetailPage,
  }) => {
    // 1. Load dashboard and expand a project
    await dashboardPage.goto();
    await dashboardPage.waitForData();

    const projectCards = dashboardPage.getProjectCards();
    await expect(projectCards.first()).toBeVisible({ timeout: 30_000 });
    await projectCards.first().locator("button").first().click();

    // 1b. Expand collapsed sub-sections (Failed Runs, Completed History) if present
    await dashboardPage.expandRunSubSections();

    // 2. Wait for run cards to appear
    const runCards = dashboardPage.getRunCards();
    await expect(runCards.first()).toBeVisible({ timeout: 15_000 });

    // 3. Get the count of visible run cards
    const count = await runCards.count();
    if (count < 2) {
      // If only one run card, just click it and verify
      await runCards.first().click();
      await runDetailPage.waitForData();
      await expect(runDetailPage.breadcrumb).toBeVisible();
      return;
    }

    // 4. Capture the href of the last run card (the one we expect to land on)
    const lastHref = await runCards.nth(count - 1).getAttribute("href");

    // 5. Rapidly click the first and then last run card
    await runCards.first().click();
    // Immediately navigate to a different run via direct URL
    // (simulates rapid clicking by bypassing the page transition wait)
    const lastRunId = lastHref?.replace("/runs/", "") ?? "";
    await runDetailPage.goto(lastRunId);
    await runDetailPage.waitForData();

    // 6. Verify we are on the last run's detail page
    await expect(runDetailPage.page).toHaveURL(new RegExp(`/runs/${lastRunId}`));
    await expect(runDetailPage.breadcrumb).toBeVisible();
  });

  test("navigate between different runs via direct URL in sequence", async ({
    runDetailPage,
  }) => {
    const runIds = [COMPLETED_RUN_ID, FAILED_RUN_ID, WAITING_RUN_ID];

    for (const runId of runIds) {
      await runDetailPage.goto(runId);
      await runDetailPage.waitForData();
      await expect(runDetailPage.page).toHaveURL(`/runs/${runId}`);

      // Verify the page shows content (either breadcrumb for loaded, or error for problematic)
      await expect(
        runDetailPage.breadcrumb.or(runDetailPage.errorMessage)
      ).toBeVisible({ timeout: 30_000 });
    }
  });
});

test.describe("Navigation: Browser refresh preserves page state", () => {
  test("browser refresh on run detail preserves the page", async ({
    runDetailPage,
  }) => {
    // 1. Navigate to a specific run
    await runDetailPage.goto(COMPLETED_RUN_ID);
    await runDetailPage.waitForData();

    // 2. Verify initial load
    await expect(runDetailPage.page).toHaveURL(`/runs/${COMPLETED_RUN_ID}`);
    await expect(runDetailPage.breadcrumb).toBeVisible();

    // 3. Refresh the browser
    await runDetailPage.page.reload();

    // 4. Verify the page reloads correctly with the same run
    await runDetailPage.waitForData();
    await expect(runDetailPage.page).toHaveURL(`/runs/${COMPLETED_RUN_ID}`);
    await expect(runDetailPage.breadcrumb).toBeVisible();
    await expect(runDetailPage.backToProjects).toBeVisible();
  });

  test("browser refresh on dashboard preserves the page", async ({
    dashboardPage,
  }) => {
    // 1. Navigate to dashboard
    await dashboardPage.goto();
    await dashboardPage.waitForData();

    // 2. Verify initial content
    await expect(dashboardPage.heading).toBeVisible();

    // 3. Refresh the browser
    await dashboardPage.page.reload();

    // 4. Verify the dashboard reloads correctly
    await dashboardPage.waitForData();
    await expect(dashboardPage.heading).toBeVisible();
    const projectCards = dashboardPage.getProjectCards();
    await expect(projectCards.first()).toBeVisible({ timeout: 30_000 });
  });

  test("browser back button from run detail returns to dashboard", async ({
    dashboardPage,
    runDetailPage,
  }) => {
    // 1. Start at dashboard
    await dashboardPage.goto();
    await dashboardPage.waitForData();

    // 2. Navigate to a run detail page via direct URL push (simulates link click)
    await runDetailPage.goto(COMPLETED_RUN_ID);
    await runDetailPage.waitForData();
    await expect(runDetailPage.breadcrumb).toBeVisible();

    // 3. Use browser back button
    await runDetailPage.page.goBack();

    // 4. Verify we return to the dashboard
    await expect(dashboardPage.heading).toBeVisible({ timeout: 30_000 });
  });
});
