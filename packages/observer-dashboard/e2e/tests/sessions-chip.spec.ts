/**
 * FROZEN acceptance e2e — SESSIONS-CHIP-SPEC (frozen 2026-07-09): the board
 * hides idle sessions from every column, surfaces a single muted "⚡ N sessions"
 * chip with a reveal toggle, keeps counts reconciled, and relabels
 * "Bare Run" → "Idle session" (AC1..AC7).
 *
 * Authored BEFORE the sessions-chip wave lands, so every test is declared with
 * `test.fixme(...)` — the house style for frozen pre-impl board e2e (see
 * kanban-board.spec.ts). When the wave lands, flip `test.fixme` → `test`; do
 * NOT weaken the assertions.
 *
 * Board scenarios are driven by /api/runs route interception (deterministic,
 * isolated), following the repo's own precedent for synthetic board runs
 * (kanban-board.spec.ts AC-25: "synthesized via /api/runs route interception,
 * no fixture needed"). Persistent on-disk idle-session fixtures are deliberately
 * NOT added: idle sessions are HIDDEN from columns, which would break the
 * disk-total reconciliation (kanban-board.spec.ts:761 headerSum === runCount)
 * and the manifest-derived dashboard tile/active counts.
 *
 * Frozen DOM contract (testids/attributes the implementation MUST render):
 *   - [data-testid="kanban-sessions-chip"]    the single muted chip; "⚡ N sessions"
 *   - chip carries data-tone="muted" (AC3: secondary, never an alert tone)
 *   - [data-testid="kanban-sessions-toggle"]  the reveal toggle (aria-pressed)
 */

import { test, expect } from "../fixtures";
import type { Page } from "@playwright/test";

const PENDING_IMPL = "pending-impl: sessions chip not implemented yet (SESSIONS-CHIP-SPEC)";

/** Minimal LightRun-shaped /api/runs entry (mirrors kanban-board.spec.ts). */
function apiRun(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const now = Date.now();
  return {
    runId: "01KSESSAPIRUN000000000000",
    processId: "synthetic/process",
    status: "waiting",
    createdAt: new Date(now - 3_600_000).toISOString(),
    updatedAt: new Date(now - 60_000).toISOString(),
    tasks: [],
    events: [],
    totalEvents: 5,
    totalTasks: 4,
    completedTasks: 2,
    failedTasks: 0,
    projectName: "synthetic-project",
    driver: "live",
    isStale: false,
    pendingBreakpoints: 0,
    ...overrides,
  };
}

/** A bare-run/0-task idle session; driver "live" so that WITHOUT the feature it
 *  would flood Working (SESSIONS-CHIP-SPEC §1 / AC1). */
function idleSession(runId: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return apiRun({
    runId,
    processId: "bare-run",
    totalTasks: 0,
    completedTasks: 0,
    pendingBreakpoints: 0,
    ...overrides,
  });
}

/** Intercept BOTH /api/runs shapes: the board list and the projects summary. */
async function intercept(page: Page, runs: Record<string, unknown>[]) {
  await page.route("**/api/runs?*", (route) => {
    const url = route.request().url();
    if (url.includes("mode=projects")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ projects: [], recentCompletionWindowMs: 3_600_000 }),
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

const chip = (page: Page) => page.getByTestId("kanban-sessions-chip");
const toggle = (page: Page) => page.getByTestId("kanban-sessions-toggle");
const cardFor = (page: Page, runId: string) =>
  page.locator(`[data-testid="kanban-card"][data-run-id="${runId}"]`);
const waitingCount = (page: Page) => page.getByTestId("kanban-column-count-waiting");

async function readInt(text: string | null): Promise<number> {
  const m = (text ?? "").match(/\d+/);
  return m ? parseInt(m[0], 10) : NaN;
}

// The scenario: 3 idle sessions + 2 real in-progress + 1 needs-you.
const IDLE_IDS = [
  "01KSESSIDLE00000000000001",
  "01KSESSIDLE00000000000002",
  "01KSESSIDLE00000000000003",
];
const WORKING_IDS = ["01KSESSWORK00000000000001", "01KSESSWORK00000000000002"];
const NEEDSYOU_ID = "01KSESSNEEDSYOU000000001";

function scenarioRuns(): Record<string, unknown>[] {
  return [
    apiRun({ runId: NEEDSYOU_ID, pendingBreakpoints: 1, totalTasks: 3 }),
    ...WORKING_IDS.map((id) => apiRun({ runId: id })),
    ...IDLE_IDS.map((id) => idleSession(id)),
  ];
}

test.describe("SESSIONS-CHIP-SPEC — board hides idle sessions behind a muted chip", () => {
  test(
    `AC2: no idle-session card renders in the Working column by default (${PENDING_IMPL})`,
    async ({ page }) => {
      await intercept(page, scenarioRuns());
      await gotoBoard(page);

      const working = page.getByTestId("kanban-column-waiting");
      for (const id of IDLE_IDS) {
        await expect(working.locator(`[data-run-id="${id}"]`)).toHaveCount(0);
        // Not in ANY column, either.
        await expect(cardFor(page, id)).toHaveCount(0);
      }
      // The real in-progress runs still render.
      for (const id of WORKING_IDS) await expect(cardFor(page, id)).toHaveCount(1);
    }
  );

  test(
    `AC3: a single muted "⚡ N sessions" chip shows the correct N (${PENDING_IMPL})`,
    async ({ page }) => {
      await intercept(page, scenarioRuns());
      await gotoBoard(page);

      await expect(chip(page)).toHaveCount(1);
      await expect(chip(page)).toContainText("⚡ 3 sessions");
      // Muted/secondary — must not compete with the alarm surface.
      await expect(chip(page)).toHaveAttribute("data-tone", "muted");
      await expect(chip(page)).not.toHaveAttribute("role", "alert");
    }
  );

  test(
    `AC4: clicking the chip toggle reveals the idle-session runs, then re-hides them (${PENDING_IMPL})`,
    async ({ page }) => {
      await intercept(page, scenarioRuns());
      await gotoBoard(page);

      // Hidden by default.
      for (const id of IDLE_IDS) await expect(cardFor(page, id)).toHaveCount(0);
      await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");

      // Reveal.
      await toggle(page).click();
      for (const id of IDLE_IDS) await expect(cardFor(page, id)).toHaveCount(1);
      await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");

      // Hide again.
      await toggle(page).click();
      for (const id of IDLE_IDS) await expect(cardFor(page, id)).toHaveCount(0);
      await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
    }
  );

  test(
    `AC6: a revealed idle-session card shows "Idle session", never "Bare Run" (${PENDING_IMPL})`,
    async ({ page }) => {
      await intercept(page, scenarioRuns());
      await gotoBoard(page);
      await toggle(page).click();

      const revealed = cardFor(page, IDLE_IDS[0]);
      await expect(revealed).toContainText("Idle session");
      await expect(revealed).not.toContainText("Bare Run");
    }
  );

  test(
    `AC5: the Working count drops by exactly the idle count and the totals reconcile (${PENDING_IMPL})`,
    async ({ page }) => {
      await intercept(page, scenarioRuns());
      await gotoBoard(page);

      // Working shows only the 2 real in-progress runs (the 3-run flood moved out).
      await expect(waitingCount(page)).toHaveText("2");

      // Reconciliation: Working column count + chip N === the 5 waiting-shaped
      // runs that flooded Working with idle-detection off (2 real + 3 idle).
      const shown = await readInt(await waitingCount(page).textContent());
      const chipN = await readInt(await chip(page).textContent());
      expect(chipN).toBe(3);
      expect(shown + chipN).toBe(5);
    }
  );
});
