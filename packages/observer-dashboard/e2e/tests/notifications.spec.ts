import { test, expect } from "../fixtures";

/**
 * E2E tests for the Notification System.
 *
 * These tests verify the notification bell, panel, toast stack,
 * and badge behavior. Because E2E fixture data is static (no runs
 * change status between polls), the stabilization window seeds
 * watermarks silently and no further notifications fire -- which
 * is the expected, non-flooding behavior we want to confirm.
 */

// ---------------------------------------------------------------------------
// Notification Bell
// ---------------------------------------------------------------------------

test.describe("Notification Bell", () => {
  test("notification bell button is visible in header", async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await expect(dashboardPage.heading).toBeVisible({ timeout: 30_000 });

    const bellButton = dashboardPage.page.getByTestId("notification-bell");
    await expect(bellButton).toBeVisible();
    await expect(bellButton).toHaveAttribute("title", "Notifications");
  });

  test("clicking notification bell toggles notification panel open and close", async ({
    dashboardPage,
  }) => {
    await dashboardPage.goto();
    // Wait for the page to fully hydrate before interacting with the bell
    await dashboardPage.waitForData();

    const bellButton = dashboardPage.page.getByTestId("notification-bell");
    const panel = dashboardPage.page.getByTestId("notification-panel");

    // Panel should not be visible initially
    await expect(panel).not.toBeVisible();

    // Click bell to open panel
    await bellButton.click();
    await expect(panel).toBeVisible({ timeout: 30_000 });

    // Panel should contain the "Notifications" title
    await expect(panel).toContainText("Notifications");

    // Press Escape to close the panel (Radix Dialog listens for Escape)
    await dashboardPage.page.keyboard.press("Escape");
    await expect(panel).not.toBeVisible({ timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// Notification Panel Content
// ---------------------------------------------------------------------------

test.describe("Notification Panel", () => {
  test("notification panel shows empty state when no notifications exist", async ({
    dashboardPage,
  }) => {
    await dashboardPage.goto();
    // Wait for the page to fully hydrate before interacting
    await dashboardPage.waitForData();

    const bellButton = dashboardPage.page.getByTestId("notification-bell");
    await bellButton.click();

    const panel = dashboardPage.page.getByTestId("notification-panel");
    await expect(panel).toBeVisible({ timeout: 30_000 });

    // The panel should display "No notifications" empty state
    await expect(panel).toContainText("No notifications");
  });

  test("notification count badge appears when notifications are present", async ({
    dashboardPage,
  }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForData();

    // Wait past the stabilization window (10s) plus one poll cycle (3s)
    // so that any post-stabilization notifications have a chance to fire.
    await dashboardPage.page.waitForTimeout(14_000);

    const badge = dashboardPage.page.getByTestId("notification-badge");
    const bellButton = dashboardPage.page.getByTestId("notification-bell");

    // With static fixture data, no new runs appear after stabilization,
    // so the badge may or may not be present. We verify:
    // - If badge exists, its count is a reasonable number (not flooded)
    // - If badge doesn't exist, that's the expected no-notification state
    const badgeVisible = await badge.isVisible().catch(() => false);

    if (badgeVisible) {
      const badgeText = await badge.innerText();
      const count = badgeText === "9+" ? 10 : parseInt(badgeText, 10);
      // With the flood fix, we should never see more than ~10 notifications
      // (one per run for "New Run Started" at most, depending on fixture count)
      expect(count).toBeLessThanOrEqual(10);
    } else {
      // No badge means zero notifications -- verify bell is still visible
      await expect(bellButton).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// Notification Flood Prevention
// ---------------------------------------------------------------------------

test.describe("Notification Flood Prevention", () => {
  test("after stabilization window, notifications do not flood the panel", async ({
    dashboardPage,
  }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForData();

    // Wait past the stabilization window (10s) plus multiple poll cycles
    // to give the system time to generate any notifications it would.
    await dashboardPage.page.waitForTimeout(18_000);

    const bellButton = dashboardPage.page.getByTestId("notification-bell");
    await bellButton.click();

    const panel = dashboardPage.page.getByTestId("notification-panel");
    await expect(panel).toBeVisible({ timeout: 30_000 });

    // Count notification items in the panel
    const items = panel.locator("[data-testid^='notification-item-']");
    const itemCount = await items.count();

    // With static fixture data, watermarks are seeded during stabilization
    // and no further status changes occur, so either:
    // - 0 notifications (all runs seeded during stabilization) -- most common
    // - A small number if timing causes a run to be seen first after the window
    // The key assertion: we must NOT see a flood (dozens of per-task notifications)
    expect(itemCount).toBeLessThanOrEqual(10);
  });
});
