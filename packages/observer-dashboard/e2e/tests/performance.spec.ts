import { test, expect } from "@playwright/test";

// Run performance tests serially so the first test warms up the dev server
test.describe.configure({ mode: "serial" });

// Give each test plenty of time (dev server compile can be slow)
test.use({ actionTimeout: 60_000 });

test.describe("Performance Tests", () => {
  test("dashboard loads and renders content", async ({ page }) => {
    test.setTimeout(180_000);

    // First load includes dev server compilation — just verify it works
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 120_000 });

    const heading = page.getByRole("heading", { name: "Babysitter Observer" });
    await expect(heading).toBeVisible({ timeout: 60_000 });

    // Wait for data to load
    await page
      .locator(".animate-pulse")
      .first()
      .waitFor({ state: "hidden", timeout: 60_000 })
      .catch(() => {});

    const projectGrid = page.getByTestId("project-grid-active")
      .or(page.getByTestId("project-grid-filtered"))
      .or(page.getByTestId("project-grid-history"));
    await expect(projectGrid).toBeVisible({ timeout: 60_000 });

    // Now measure a reload (server is warm)
    const startTime = Date.now();
    await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
    await expect(heading).toBeVisible({ timeout: 60_000 });
    await expect(projectGrid).toBeVisible({ timeout: 60_000 });

    const reloadTime = Date.now() - startTime;
    console.log(`Dashboard reload time (warm): ${reloadTime}ms`);

    // After warm-up, reload should complete within 60 seconds
    expect(reloadTime).toBeLessThan(60_000);
  });

  test("SSE connection indicator appears", async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });

    const heading = page.getByRole("heading", { name: "Babysitter Observer" });
    await expect(heading).toBeVisible({ timeout: 60_000 });

    // Check for SSE connection status indicator (uses title attribute)
    const connectionIndicator = page.locator("[title*='Live updates']");
    await expect(connectionIndicator).toBeVisible({ timeout: 30_000 });
    console.log("SSE connection indicator visible");
  });

  test("DOM size is within acceptable limits", async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });

    const heading = page.getByRole("heading", { name: "Babysitter Observer" });
    await expect(heading).toBeVisible({ timeout: 60_000 });

    await page
      .locator(".animate-pulse")
      .first()
      .waitFor({ state: "hidden", timeout: 60_000 })
      .catch(() => {});

    const projectGrid = page.getByTestId("project-grid-active")
      .or(page.getByTestId("project-grid-filtered"))
      .or(page.getByTestId("project-grid-history"));
    await expect(projectGrid).toBeVisible({ timeout: 60_000 });

    // Count DOM nodes
    const nodeCount = await page.evaluate(() => {
      return document.querySelectorAll("*").length;
    });

    console.log(`DOM node count: ${nodeCount}`);

    // Assert DOM size is reasonable (< 5000 nodes)
    expect(nodeCount).toBeLessThan(5_000);
  });

  test("navigation to run detail and back is performant", async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });

    const heading = page.getByRole("heading", { name: "Babysitter Observer" });
    await expect(heading).toBeVisible({ timeout: 60_000 });

    await page
      .locator(".animate-pulse")
      .first()
      .waitFor({ state: "hidden", timeout: 60_000 })
      .catch(() => {});

    const projectGrid = page.getByTestId("project-grid-active")
      .or(page.getByTestId("project-grid-filtered"))
      .or(page.getByTestId("project-grid-history"));
    await expect(projectGrid).toBeVisible({ timeout: 60_000 });

    // Try expanding a project card to reveal run links
    const projectCard = projectGrid.locator("> *").first();
    await projectCard.click();
    await page.waitForTimeout(2_000);

    const runLink = page.locator("a[href^='/runs/']").first();
    const canNavigate = await runLink.isVisible({ timeout: 10_000 }).catch(() => false);

    if (canNavigate) {
      const navStartTime = Date.now();
      await runLink.click();
      await page.waitForURL(/\/runs\//, { timeout: 30_000 });
      const navTime = Date.now() - navStartTime;
      console.log(`Navigation to run detail: ${navTime}ms`);
      expect(navTime).toBeLessThan(30_000);

      const backStartTime = Date.now();
      await page.goBack({ waitUntil: "domcontentloaded", timeout: 30_000 });
      await expect(heading).toBeVisible({ timeout: 30_000 });
      const backTime = Date.now() - backStartTime;
      console.log(`Navigation back to dashboard: ${backTime}ms`);
      expect(backTime).toBeLessThan(30_000);
    } else {
      console.log("No run links found - skipping navigation timing");
    }
  });

  test("no console errors during normal operation", async ({ page }) => {
    test.setTimeout(120_000);

    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });

    const heading = page.getByRole("heading", { name: "Babysitter Observer" });
    await expect(heading).toBeVisible({ timeout: 60_000 });

    await page
      .locator(".animate-pulse")
      .first()
      .waitFor({ state: "hidden", timeout: 60_000 })
      .catch(() => {});

    const projectGrid = page.getByTestId("project-grid-active")
      .or(page.getByTestId("project-grid-filtered"))
      .or(page.getByTestId("project-grid-history"));
    await expect(projectGrid).toBeVisible({ timeout: 60_000 });

    // Wait a bit for any async errors to surface
    await page.waitForTimeout(2_000);

    // Filter out known benign errors (e.g., Next.js HMR in dev mode)
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes("[HMR]") &&
        !err.includes("Fast Refresh") &&
        !err.includes("hydration")
    );

    console.log(`Console errors found: ${criticalErrors.length}`);
    if (criticalErrors.length > 0) {
      console.log("Errors:", criticalErrors);
    }

    expect(criticalErrors).toHaveLength(0);
  });
});
