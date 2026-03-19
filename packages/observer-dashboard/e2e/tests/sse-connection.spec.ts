import { test, expect } from "../fixtures";

/**
 * E2E tests for SSE (Server-Sent Events) connection behavior.
 *
 * Tests cover:
 * - SSE connection status indicator visibility in the header
 * - SSE indicator displays "Live" text when connected
 * - SSE indicator has green/success styling when connected
 * - Dashboard loads data via SSE (project cards appear after connection)
 */

test.describe("SSE Connection", () => {
  test("SSE connection status indicator is visible in header", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage.goto();
    await expect(dashboardPage.heading).toBeVisible({ timeout: 30_000 });

    const sseStatus = page.getByTestId("sse-status");
    await expect(sseStatus).toBeVisible({ timeout: 30_000 });
  });

  test("SSE indicator shows Live text when connected", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForData();

    const sseStatus = page.getByTestId("sse-status");
    await expect(sseStatus).toBeVisible({ timeout: 30_000 });

    // The SSE indicator should show "Live" when connected.
    // The text is inside a <span class="hidden sm:inline"> child,
    // so we check the overall status element contains "Live".
    await expect(sseStatus).toContainText("Live", { timeout: 30_000 });
  });

  test("SSE indicator has success styling when connected", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForData();

    const sseStatus = page.getByTestId("sse-status");
    await expect(sseStatus).toBeVisible({ timeout: 30_000 });

    // Wait for "Live" to confirm connection is established
    await expect(sseStatus).toContainText("Live", { timeout: 30_000 });

    // Verify success styling: the connected state applies classes including
    // "bg-success/10", "text-success", and "border-success/20".
    // We check via the class attribute containing "text-success".
    await expect(sseStatus).toHaveClass(/text-success/);

    // Also verify the title attribute reflects connected state
    await expect(sseStatus).toHaveAttribute("title", "Live updates connected");
  });

  test("dashboard loads data via SSE and project cards appear", async ({
    dashboardPage,
  }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForData();

    // After SSE connection is established and data loads, project cards should be visible
    const projectCards = dashboardPage.getProjectCards();
    await expect(projectCards.first()).toBeVisible({ timeout: 60_000 });

    // Verify there is at least one project card rendered
    const count = await projectCards.count();
    expect(count).toBeGreaterThan(0);
  });
});
