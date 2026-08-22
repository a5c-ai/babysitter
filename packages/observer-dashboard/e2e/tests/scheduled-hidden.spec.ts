/**
 * §15.1 (owner gate 2026-07-06b, hidden model A + org panel) — e2e for the
 * first-class "scheduled" (sleeping forever-run) state and the hide-affordance
 * microcopy (AC-83..AC-88). Read-only contract: the board is driven by
 * intercepted GET /api/runs data; nothing is written and the copyable resume
 * command is inert selectable text.
 *
 * These tests cover the VISIBLE behaviors a unit test cannot:
 *  - AC-84: a future-wake scheduled run reads calm in its own Scheduled column
 *           ("next run …"), never in Stalled.
 *  - AC-85: an overdue scheduled run shows the amber "wake overdue … — resume"
 *           sub-state with a copyable, inert `babysitter run:iterate <runId>`.
 *  - AC-86: the Scheduled column is distinct from Working and Stalled.
 *  - AC-87: the ONE hide-affordance explanatory line appears on BOTH the grid
 *           hide control and the settings-modal hidden-projects section.
 */

import { test, expect } from "../fixtures";
import type { Page } from "@playwright/test";

// The verbatim AC-87 microcopy (must match HIDE_AFFORDANCE_MICROCOPY).
const HIDE_MICROCOPY_MARKER =
  "still alarm you for approvals and surface live/scheduled runs";

/** Minimal LightRun-shaped /api/runs entry. */
function apiRun(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const now = Date.now();
  return {
    runId: "01KSCHEDRUN00000000000000",
    processId: "wc26/nightly-finalize",
    status: "waiting",
    createdAt: new Date(now - 3_600_000).toISOString(),
    updatedAt: new Date(now - 60_000).toISOString(),
    tasks: [],
    events: [],
    totalEvents: 3,
    totalTasks: 2,
    completedTasks: 1,
    failedTasks: 0,
    projectName: "wc26-pool",
    driver: "live",
    isStale: false,
    pendingBreakpoints: 0,
    ...overrides,
  };
}

/**
 * Intercept BOTH /api/runs shapes off one handler: the board list
 * ({runs,totalCount}) and the projects summary ({projects,...}) so the grid
 * can be forced to show a hidden project (and thus the hide microcopy).
 */
async function intercept(
  page: Page,
  runs: Record<string, unknown>[],
  projects?: Record<string, unknown>[]
) {
  await page.route("**/api/runs?*", (route) => {
    const url = route.request().url();
    if (url.includes("mode=projects")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          projects: projects ?? [],
          recentCompletionWindowMs: 3_600_000,
        }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ runs, totalCount: runs.length }),
    });
  });
}

async function gotoBoard(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("kanban-board")).toBeVisible({ timeout: 30_000 });
}

const scheduledColumn = (page: Page) => page.getByTestId("kanban-column-scheduled");
const cardFor = (page: Page, runId: string) =>
  page.locator(`[data-testid="kanban-card"][data-run-id="${runId}"]`);

test.describe("§15.1 scheduled (sleeping forever-run) column", () => {
  test("AC-84/86: a future-wake scheduled run reads calm in its own Scheduled column, never Working/Stalled", async ({
    page,
  }) => {
    const wakeFuture = new Date(Date.now() + 6 * 3_600_000).toISOString();
    await intercept(page, [
      apiRun({
        runId: "01KSCHEDFUTURE00000000001",
        driver: "scheduled",
        sleepWakeAt: wakeFuture,
      }),
    ]);
    await gotoBoard(page);

    // Its own column exists and holds the run.
    await expect(scheduledColumn(page)).toBeVisible();
    await expect(
      scheduledColumn(page).locator('[data-run-id="01KSCHEDFUTURE00000000001"]')
    ).toHaveCount(1);
    // Calm affordance: the detailed "next run …" label lives on the body badge
    // (the row-1 chip is the compact status glance) — target the badge testid.
    const futureBadge = cardFor(page, "01KSCHEDFUTURE00000000001").getByTestId(
      "kanban-scheduled-badge"
    );
    await expect(futureBadge).toBeVisible();
    await expect(futureBadge).toContainText(/next run/i);
    await expect(futureBadge).not.toHaveAttribute("data-scheduled-overdue", "true");
    // Never pooled with Stalled/Working (AC-86).
    await expect(
      page.getByTestId("kanban-column-stalled").locator('[data-run-id="01KSCHEDFUTURE00000000001"]')
    ).toHaveCount(0);
    await expect(
      page.getByTestId("kanban-column-waiting").locator('[data-run-id="01KSCHEDFUTURE00000000001"]')
    ).toHaveCount(0);
  });

  test("AC-85/88: an overdue scheduled run shows the amber wake-overdue state with a copyable INERT run:iterate command", async ({
    page,
  }) => {
    const wakePast = new Date(Date.now() - 17 * 3_600_000).toISOString();
    await intercept(page, [
      apiRun({
        runId: "01KSCHEDOVERDUE0000000001",
        driver: "scheduled",
        sleepWakeAt: wakePast,
      }),
    ]);
    await gotoBoard(page);

    const card = cardFor(page, "01KSCHEDOVERDUE0000000001");
    await expect(card).toBeVisible();
    // Amber overdue sub-state (AC-85) — the detailed "wake overdue …" label is
    // on the body badge (the row-1 chip shows the compact "overdue" glance).
    const overdueBadge = card.getByTestId("kanban-scheduled-badge");
    await expect(overdueBadge).toHaveAttribute("data-scheduled-overdue", "true");
    await expect(overdueBadge).toContainText(/wake overdue/i);
    // Copyable INERT resume command (AC-88): the exact babysitter run:iterate
    // text is present as selectable code, not a server action.
    await expect(card.getByTestId("kanban-bp-run-iterate-text")).toHaveText(
      "babysitter run:iterate 01KSCHEDOVERDUE0000000001"
    );
  });
});

test.describe("§15.1 AC-87 hide-affordance microcopy", () => {
  test("the explanatory line appears on the grid hide control when a project is hidden", async ({
    page,
  }) => {
    await intercept(
      page,
      [apiRun({ runId: "01KSCHEDVISIBLE0000000001" })],
      [
        {
          projectName: "home",
          totalRuns: 3,
          activeRuns: 1,
          completedRuns: 2,
          failedRuns: 0,
          staleRuns: 0,
          totalTasks: 5,
          completedTasksAggregate: 4,
          latestUpdate: new Date().toISOString(),
          pendingBreakpoints: 0,
          orphanedRuns: 0,
          breakpointRuns: [],
          hidden: true,
        },
      ]
    );
    await gotoBoard(page);

    const microcopy = page.getByTestId("hide-affordance-microcopy");
    await expect(microcopy.first()).toBeVisible();
    await expect(microcopy.first()).toContainText(HIDE_MICROCOPY_MARKER);
  });

  test("the same explanatory line appears in the settings-modal hidden-projects section", async ({
    page,
    dashboardPage,
  }) => {
    await dashboardPage.goto();
    await dashboardPage.openSettings();
    const modal = page.getByTestId("settings-modal");
    await expect(modal).toBeVisible();
    // The Project Visibility section renders the verbatim microcopy.
    await expect(
      modal.getByTestId("hide-affordance-microcopy")
    ).toContainText(HIDE_MICROCOPY_MARKER);
  });
});
