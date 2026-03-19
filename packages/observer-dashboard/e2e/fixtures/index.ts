import { test as base } from "@playwright/test";
import { DashboardPage } from "../pages/dashboard.page";
import { RunDetailPage } from "../pages/run-detail.page";

/**
 * Extended Playwright test fixtures that provide pre-constructed
 * page objects for the Observer dashboard.
 *
 * Usage:
 *   import { test, expect } from "../fixtures";
 *
 *   test("dashboard loads", async ({ dashboardPage }) => {
 *     await dashboardPage.goto();
 *     await dashboardPage.waitForData();
 *   });
 */
type ObserverFixtures = {
  dashboardPage: DashboardPage;
  runDetailPage: RunDetailPage;
};

export const test = base.extend<ObserverFixtures>({
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },
  runDetailPage: async ({ page }, use) => {
    const runDetailPage = new RunDetailPage(page);
    await use(runDetailPage);
  },
});

export { expect } from "@playwright/test";
