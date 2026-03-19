import { test, expect } from "@playwright/test";

test.describe("Smoke Test", () => {
  test("dashboard loads and displays content", async ({ page }) => {
    // Navigate to the dashboard - increase timeout for first compile
    await page.goto("/", { timeout: 60_000, waitUntil: "domcontentloaded" });

    // Wait for the heading to appear
    const heading = page.getByRole("heading", { name: "Babysitter Observer" }).first();
    await expect(heading).toBeVisible({ timeout: 30_000 });

    // Wait for loading skeletons to disappear
    await page
      .locator(".animate-pulse")
      .first()
      .waitFor({ state: "hidden", timeout: 30_000 })
      .catch(() => {
        // Skeletons may never appear if data loads fast enough
      });

    // Verify at least one project grid is visible (active runs or filtered results)
    const projectGrid = page.getByTestId("project-grid-active")
      .or(page.getByTestId("project-grid-filtered"))
      .or(page.getByTestId("project-grid-history"));
    await expect(projectGrid).toBeVisible({ timeout: 30_000 });

    // Verify the page has at least one project card with content
    const projectCards = page.locator("[data-testid^='project-card-']");
    await expect(projectCards.first()).toBeVisible({ timeout: 10_000 });
  });
});
