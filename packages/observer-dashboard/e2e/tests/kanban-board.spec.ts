/**
 * FROZEN acceptance tests — SPEC-vibekanban §10, board behaviors
 * (AC-11..AC-25, AC-27). Authored BEFORE any board implementation exists.
 *
 * Every test below is declared with `test.fixme(...)` — pending-impl: the
 * kanban board (src/components/kanban/**) does not exist yet. These tests are
 * the frozen definition of done for the board waves; when a wave lands, flip
 * its tests from `test.fixme` to `test` — do NOT weaken the assertions.
 *
 * UX-R2 SUPERSESSION (per owner gate 2026-07-05 run 01KWRR8XAHFCDEGCRBRFHFF44W:
 * 4-column taxonomy + color map — SPEC §13.2 option (b), §13.6 register):
 * the board renders FOUR display-level columns over the unchanged six-bucket
 * partition. AC-12 superseded (order/presence = Needs you → Working → Stalled
 * → Done; Stalled auto-hides when empty, Done always visible); AC-13/21/22/23
 * amended mechanically (column keys/testids: orphaned+stale → `stalled` host,
 * failed+completed → `done`); AC-18/AC-24 column references remapped the same
 * mechanical way. Six-bucket predicates, pills, and card behaviors unchanged.
 *
 * Frozen DOM contract (testids the implementation MUST render — SPEC §10
 * names `kanban-board` and `kanban-column-count-<key>` explicitly; the rest
 * are fixed by this file as the frozen contract):
 *   - [data-testid="kanban-board"]                board container (role="region", aria-label="Run board")
 *   - [data-testid="kanban-column-<key>"]         column, key ∈ needsyou|waiting|stalled|done
 *   - [data-testid="kanban-column-count-<key>"]   header count (text = integer)
 *   - [data-testid="kanban-column-cards-<key>"]   the column's scrollable card container
 *   - [data-testid="kanban-card"][data-run-id]    a card; data-run-id = full runId
 *   - [data-testid="view-toggle-board"] / [data-testid="view-toggle-list"]  segmented control (aria-pressed)
 *   - [data-testid="kanban-bp-option-chip"]       REMOVED by UX-R3 §14.3/AC-55 (de-dup); options now render
 *                                                 exactly once as option-btn-<option> buttons in the answer panel
 *   - [data-testid="kanban-bp-answer-toggle"]     expands the Answer section (mounts existing BreakpointApproval)
 *   - focus/dim (AC-23): focused column gets [data-focused="true"], dimmed columns get [data-dimmed="true"]
 * Reused existing testids: breakpoint-approval, option-btn-<option>,
 * custom-answer-input, run-action-hint, hidden-projects-indicator,
 * filter-pill-<key>, empty-state, run-list-flat, executive-summary-banner
 * (owner 2026-07-07: deduped needs-you surface — the removed top breakpoint-banner
 * list's alarm role is now carried by the counts banner + this Needs-you column).
 *
 * Fixture prerequisites NOT yet in e2e/fixtures (to be added by the
 * implementation waves; reserved ids are frozen here):
 *   - KANBAN_LONG_BP_RUN_ID   pending breakpoint, question > 120 chars (verbatim below), options list (AC-14)
 *   - KANBAN_APPROVE_BP_RUN_ID  pending breakpoint dedicated to the approve test (AC-15) so the shared
 *                               banner fixture 01KTESTPENDINGBPFIXTURE0 is never mutated
 *   - KANBAN_SSE_BP_RUN_ID    pending breakpoint dedicated to the SSE movement test (AC-18)
 *   - hidden-project registry entry + runs for AC-19 (registry hiddenProjects: ["kanban-hidden-project"])
 *   - a ~50h-old run for AC-25 is synthesized via /api/runs route interception (no fixture needed)
 */

import { test, expect, type Page } from "@playwright/test";
import { promises as fs } from "fs";
import path from "path";
import { getManifest, runDir, FIXTURES_RUNS_DIR } from "../fixtures/test-data";
import type { Manifest } from "../fixtures/test-data";

// Display columns per owner gate 2026-07-05 run 01KWRR8XAHFCDEGCRBRFHFF44W:
// 4-column taxonomy + color map (SPEC §13.2 option b). Stalled hosts the
// orphaned+stale buckets; Done hosts failed+completed. Pills stay 6-bucket.
const COLUMN_KEYS = ["needsyou", "waiting", "stalled", "done"] as const;
type ColumnKey = (typeof COLUMN_KEYS)[number] | "scheduled";

// §15.1 (owner gate 2026-07-06b, AC-77 — Scheduled column participates in the
// board total): the Scheduled column is the 5th board column, auto-hidden when
// empty. It is deliberately NOT one of the 4 always-present COLUMN_KEYS, but it
// MUST be summed into any board-TOTAL reconciliation (a run parked at an
// unresolved sleep effect lives here, not in Working/Stalled). Use this set —
// not COLUMN_KEYS — anywhere a test totals every board column.
const TOTAL_COLUMN_KEYS = [...COLUMN_KEYS, "scheduled"] as const;

// Existing shared fixture (read-only in this spec — see breakpoints.spec.ts).
// It has NO run.lock => driver "none" => orphaned-driver Needs-you card (AC-16).
const PENDING_BP_RUN_ID = "01KTESTPENDINGBPFIXTURE0";

// Reserved fixture ids (frozen contract — implementation waves add the dirs).
const KANBAN_LONG_BP_RUN_ID = "01KTESTKANBANLONGBP00001";
const KANBAN_LONG_BP_EFFECT_ID = "01KTEST_KANBAN_LONGBP_01";
const KANBAN_APPROVE_BP_RUN_ID = "01KTESTKANBANAPPROVE0002";
const KANBAN_APPROVE_BP_EFFECT_ID = "01KTEST_KANBAN_APPROVE_1";
const KANBAN_SSE_BP_RUN_ID = "01KTESTKANBANSSEMOVE0003";
const KANBAN_SSE_BP_EFFECT_ID = "01KTEST_KANBAN_SSE_BP_01";
const HIDDEN_PROJECT_NAME = "kanban-hidden-project";
const HIDDEN_BP_RUN_ID = "01KTESTKANBANHIDDENBP004";
const HIDDEN_PLAIN_RUN_ID = "01KTESTKANBANHIDDENWK005";

// UX-R2 §13.1 fixtures (AC-33/AC-34 — NEW acceptance criteria, gate-free
// bug fix, taxonomy-independent per §13.6):
// - PAYLOAD: v6 ctx.breakpoint evidence shape (question/title ONLY under
//   task.json metadata.payload; no input.json; no question in inputs) —
//   replicates run demo-client-project/01KWE8RYQEHJ7BATR3V88AQVSD.
// - NOQUEST: a genuinely question-less breakpoint (no question in ANY source).
// - TASKDEF: SDK 6.0.2 ctx.breakpoint shape (question/options ONLY under
//   task.json → .breakpoint; metadata null; no input.json; no question in
//   inputs) — replicates run 01KWRJGED9BEE39SSPMH0M4JE3/01KWS6QP63XWADWW6N7HBGQ3GH.
const KANBAN_PAYLOAD_BP_RUN_ID = "01KTESTKANBANPAYLOAD0006";
const KANBAN_NOQUEST_BP_RUN_ID = "01KTESTKANBANNOQUEST0007";
const KANBAN_NOQUEST_BP_EFFECT_ID = "01KTEST_KANBAN_NOQUEST_1";
const KANBAN_TASKDEF_BP_RUN_ID = "01KTESTKANBANTASKDEF0008";

// AC-33: payload title + distinctive question substring, asserted against the
// fixture's metadata.payload (the sources the old parser never read).
const PAYLOAD_BP_TITLE = "Gate 1 — Coordinate partition with Dana";
const PAYLOAD_BP_QUESTION_MARKER = "COORDINATION GATE";

// AC-35: task-def title + distinctive question substring + options, asserted
// against the fixture's task.json → .breakpoint block (SDK 6.0.2 shape — the
// source the pre-fix resolver never read).
const TASKDEF_BP_TITLE = "Gate 2 — Accept the release cut (nothing is pushed)";
const TASKDEF_BP_QUESTION_MARKER = "TASKDEF GATE";
const TASKDEF_BP_OPTIONS = ["Accept", "Request changes"];

// AC-32/AC-34: the honest last-resort copy, frozen VERBATIM (SPEC §13.1).
const NOQUEST_FALLBACK_COPY =
  // owner 2026-07-08: de-AI copy (no em-dashes) + answer-flow clarity
  "Approval required: this breakpoint has no question text on disk.";

// AC-14: the fixture question, asserted VERBATIM (length > 120 chars).
const LONG_BP_QUESTION =
  "The staging deploy changes the database schema, rotates two service credentials, and restarts the ingest workers — do you approve rolling this out to the shared staging environment now?";
const LONG_BP_OPTIONS = ["approve", "reject", "defer to tomorrow"];

const PENDING_IMPL = "pending-impl: kanban board not implemented yet (SPEC-vibekanban §10)";

let manifest: Manifest;
test.beforeAll(async () => {
  manifest = await getManifest();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const board = (page: Page) => page.getByTestId("kanban-board");
const column = (page: Page, key: ColumnKey) => page.getByTestId(`kanban-column-${key}`);
const columnCount = (page: Page, key: ColumnKey) => page.getByTestId(`kanban-column-count-${key}`);
const cardsIn = (page: Page, key: ColumnKey) =>
  column(page, key).locator('[data-testid="kanban-card"]');
const cardFor = (page: Page, runId: string) =>
  page.locator(`[data-testid="kanban-card"][data-run-id="${runId}"]`);

async function gotoBoard(page: Page) {
  // SSE keeps the "load" event open — same pattern as DashboardPage.goto().
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(board(page)).toBeVisible({ timeout: 30_000 });
}

async function readCount(page: Page, key: ColumnKey): Promise<number> {
  const text = (await columnCount(page, key).textContent()) ?? "";
  const match = text.match(/\d+/);
  expect(match, `column count for ${key} must contain an integer, got "${text}"`).not.toBeNull();
  return parseInt(match![0], 10);
}

/** Minimal LightRun-shaped payload entry for /api/runs route interception. */
function makeApiRun(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const now = Date.now();
  return {
    runId: "01KSYNTHRUN0000000000000",
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

/** Intercept the board's /api/runs list fetch (never /api/runs/<id>). */
async function interceptRuns(page: Page, runs: Record<string, unknown>[], totalCount?: number) {
  await page.route("**/api/runs?*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ runs, totalCount: totalCount ?? runs.length }),
    })
  );
}

/** Append an EFFECT_RESOLVED journal entry + result.json the way the approve
 *  server action does — used to simulate a breakpoint being answered on disk. */
async function resolveBreakpointOnDisk(runId: string, effectId: string): Promise<string[]> {
  const dir = runDir(runId);
  const journalDir = path.join(dir, "journal");
  const entries = await fs.readdir(journalDir);
  const nextSeq = entries.length + 1;
  const entryId = `01KTESTRESOLVED${String(nextSeq).padStart(9, "0")}`;
  const journalPath = path.join(
    journalDir,
    `${String(nextSeq).padStart(6, "0")}.${entryId}.json`
  );
  const resultPath = path.join(dir, "tasks", effectId, "result.json");
  const nowIso = new Date().toISOString();
  await fs.writeFile(
    resultPath,
    JSON.stringify({ answer: "approve", approvedAt: nowIso }, null, 2)
  );
  await fs.writeFile(
    journalPath,
    JSON.stringify(
      {
        type: "EFFECT_RESOLVED",
        recordedAt: nowIso,
        data: {
          effectId,
          status: "ok",
          resultRef: `tasks/${effectId}/result.json`,
          startedAt: nowIso,
          finishedAt: nowIso,
        },
        checksum: "e2e-kanban-sse-fixture",
      },
      null,
      2
    )
  );
  return [journalPath, resultPath];
}

// ---------------------------------------------------------------------------
// Board rendering & chrome
// ---------------------------------------------------------------------------

test.describe("Kanban board — rendering & chrome (SPEC-vibekanban)", () => {
  test(
    `AC-11: board is the default view on a fresh profile and the board/list toggle persists across reloads (${PENDING_IMPL})`,
    async ({ page }) => {
      await gotoBoard(page);

      // Fresh profile => board by default; the project grid is absent.
      await expect(board(page)).toBeVisible();
      await expect(page.locator('[data-testid^="project-grid-"]')).toHaveCount(0);

      // Switch to List and reload: list persists (usePersistedState "observer:dashboard-view").
      await page.getByTestId("view-toggle-list").click();
      await expect(board(page)).not.toBeVisible();
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.locator('[data-testid^="project-grid-"]').first()).toBeVisible({
        timeout: 30_000,
      });
      await expect(board(page)).not.toBeVisible();

      // Switch back to Board and reload: board persists.
      await page.getByTestId("view-toggle-board").click();
      await expect(board(page)).toBeVisible({ timeout: 30_000 });
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(board(page)).toBeVisible({ timeout: 30_000 });
      await expect(page.locator('[data-testid^="project-grid-"]')).toHaveCount(0);
    }
  );

  test(
    // AC-12 SUPERSEDED per owner gate 2026-07-05 run 01KWRR8XAHFCDEGCRBRFHFF44W:
    // 4-column taxonomy + color map (§13.6): order/presence = Needs you →
    // Working → Stalled → Done; Stalled auto-hides when empty, Done always visible.
    `AC-12 (superseded by §13.2b): columns render in 4-column order and Stalled auto-hides when empty (${PENDING_IMPL})`,
    async ({ page }) => {
      // Deterministic bucket population via /api/runs interception:
      // no orphaned, no stale => the Stalled column must be absent from the DOM.
      await interceptRuns(page, [
        makeApiRun({ runId: "01KSYNTHNEEDSYOU00000001", pendingBreakpoints: 1 }),
        makeApiRun({ runId: "01KSYNTHWORKING000000002" }),
        makeApiRun({ runId: "01KSYNTHFAILED0000000003", status: "failed" }),
        makeApiRun({ runId: "01KSYNTHDONE000000000004", status: "completed", completedTasks: 4 }),
      ]);
      await gotoBoard(page);

      await expect(column(page, "needsyou")).toBeVisible();
      await expect(column(page, "waiting")).toBeVisible();
      await expect(column(page, "done")).toBeVisible(); // Done always visible
      await expect(column(page, "stalled")).toHaveCount(0); // auto-hidden, absent from DOM

      // Now include orphaned + stale runs: all four columns, in §13.2b order.
      await page.unroute("**/api/runs?*");
      await interceptRuns(page, [
        makeApiRun({ runId: "01KSYNTHNEEDSYOU00000001", pendingBreakpoints: 1 }),
        makeApiRun({ runId: "01KSYNTHORPHANED00000005", driver: "none" }),
        makeApiRun({ runId: "01KSYNTHWORKING000000002" }),
        makeApiRun({ runId: "01KSYNTHSTALE00000000006", isStale: true }),
        makeApiRun({ runId: "01KSYNTHFAILED0000000003", status: "failed" }),
        makeApiRun({ runId: "01KSYNTHDONE000000000004", status: "completed", completedTasks: 4 }),
      ]);
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(board(page)).toBeVisible({ timeout: 30_000 });

      const testids = await board(page)
        .locator('[data-testid^="kanban-column-"]:not([data-testid^="kanban-column-count-"]):not([data-testid^="kanban-column-cards-"]):not([data-testid^="kanban-column-info-"]):not([data-testid^="kanban-column-tail-"]):not([data-testid^="kanban-column-label-"])')
        .evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")));
      expect(testids).toEqual([
        "kanban-column-needsyou",
        "kanban-column-waiting",
        "kanban-column-stalled",
        "kanban-column-done",
      ]);
    }
  );

  test(
    `AC-13: every column header count equals the number of rendered cards in that column (${PENDING_IMPL})`,
    async ({ page }) => {
      // <=15 per column so virtualization (threshold 15) does not hide cards.
      const runs = [
        ...Array.from({ length: 3 }, (_, i) =>
          makeApiRun({ runId: `01KSYNTHBP000000000000${String(i).padStart(2, "0")}`, pendingBreakpoints: 1 })
        ),
        ...Array.from({ length: 5 }, (_, i) =>
          makeApiRun({ runId: `01KSYNTHWK000000000000${String(i).padStart(2, "0")}` })
        ),
        ...Array.from({ length: 2 }, (_, i) =>
          makeApiRun({ runId: `01KSYNTHOR000000000000${String(i).padStart(2, "0")}`, driver: "orphaned" })
        ),
        ...Array.from({ length: 4 }, (_, i) =>
          makeApiRun({ runId: `01KSYNTHFL000000000000${String(i).padStart(2, "0")}`, status: "failed" })
        ),
        ...Array.from({ length: 6 }, (_, i) =>
          makeApiRun({ runId: `01KSYNTHCP000000000000${String(i).padStart(2, "0")}`, status: "completed", completedTasks: 4 })
        ),
      ];
      await interceptRuns(page, runs);
      await gotoBoard(page);

      // Amended per owner gate 2026-07-05 run 01KWRR8XAHFCDEGCRBRFHFF44W
      // (4-column taxonomy): orphaned(2) hosts under Stalled; failed(4) +
      // completed(6) host under Done. Same runs, same math, grouped hosts.
      const expected: Partial<Record<ColumnKey, number>> = {
        needsyou: 3,
        waiting: 5,
        stalled: 2,
        done: 10,
      };
      for (const key of COLUMN_KEYS) {
        if (expected[key] === undefined) continue;
        await expect(column(page, key)).toBeVisible();
        expect(await readCount(page, key), `header count for ${key}`).toBe(expected[key]);
        await expect(cardsIn(page, key)).toHaveCount(expected[key]!);
      }
    }
  );

  test(
    `AC-25: card ages >=48h render in days ("2d ago" for a 50h-old run) (${PENDING_IMPL})`,
    async ({ page }) => {
      const fiftyHoursAgo = new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString();
      await interceptRuns(page, [
        makeApiRun({ runId: "01KSYNTHOLD0000000000001", updatedAt: fiftyHoursAgo }),
      ]);
      await gotoBoard(page);
      const card = cardFor(page, "01KSYNTHOLD0000000000001");
      await expect(card).toBeVisible();
      await expect(card).toContainText("2d ago");
      await expect(card).not.toContainText("50h");
    }
  );

  test(
    `AC-27: list-mode regression guard — grid and flat filtered list behave as on the base branch, with zero board elements (${PENDING_IMPL})`,
    async ({ page }) => {
      await gotoBoard(page);
      await page.getByTestId("view-toggle-list").click();

      // "All" list mode = the existing project grid (smoke assertion mirroring
      // dashboard.spec.ts), with no board elements in the DOM.
      await expect(page.locator('[data-testid^="project-grid-"]').first()).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.locator('[data-testid^="kanban-"]')).toHaveCount(0);
      await expect(page.getByTestId("project-count")).toBeVisible();

      // A status pill in list mode still swaps to the flat run list (existing behavior).
      await page.getByTestId("filter-pill-completed").click();
      await expect(
        page.getByTestId("run-list").or(page.getByText("No runs found"))
      ).toBeVisible({ timeout: 30_000 });
      await expect(page.locator('[data-testid^="kanban-"]')).toHaveCount(0);
    }
  );
});

// ---------------------------------------------------------------------------
// Needs-you cards: question, options, informing approve
// ---------------------------------------------------------------------------

test.describe("Kanban board — Needs-you cards (SPEC-vibekanban)", () => {
  test(
    `AC-14: a Needs-you card shows the FULL breakpoint question verbatim (>120 chars) and one chip per option (${PENDING_IMPL})`,
    async ({ page }) => {
      // Fixture prerequisite: KANBAN_LONG_BP_RUN_ID with the exact question +
      // options frozen at the top of this file.
      expect(LONG_BP_QUESTION.length).toBeGreaterThan(120);
      await gotoBoard(page);

      const card = cardFor(page, KANBAN_LONG_BP_RUN_ID);
      await expect(card).toBeVisible({ timeout: 15_000 });
      await expect(column(page, "needsyou").locator(`[data-run-id="${KANBAN_LONG_BP_RUN_ID}"]`)).toBeVisible();

      // Full question, verbatim, not truncated.
      await expect(card).toContainText(LONG_BP_QUESTION);

      // UX-R3 §14.3 / AC-55 (owner gate 2026-07-06 ruling, option a): the gold
      // informative option chips are REMOVED (de-dup). Options render exactly
      // ONCE — as the neutral buttons inside the expandable answer panel.
      await expect(card.getByTestId("kanban-bp-option-chip")).toHaveCount(0);
      await card.getByTestId("kanban-bp-answer-toggle").click();
      const approval = card.getByTestId("breakpoint-approval");
      await expect(approval).toBeVisible();
      for (const option of LONG_BP_OPTIONS) {
        await expect(approval.getByTestId(`option-btn-${option}`)).toHaveCount(1);
      }
    }
  );

  test(
    "AC-15: submitting an option from a Needs-you card invokes the existing approve flow (result.json + EFFECT_RESOLVED on disk) and performs no other network write",
    async ({ page }) => {
      // Fixture prerequisite: KANBAN_APPROVE_BP_RUN_ID — a dedicated pending
      // breakpoint (options include "approve") so the shared banner fixture
      // is never mutated by this test.
      const dir = runDir(KANBAN_APPROVE_BP_RUN_ID);
      const resultPath = path.join(dir, "tasks", KANBAN_APPROVE_BP_EFFECT_ID, "result.json");
      const journalDir = path.join(dir, "journal");
      const journalBefore = await fs.readdir(journalDir);

      // Track every non-GET request: the ONLY write allowed is the Next.js
      // server action POST that carries approveBreakpoint.
      const nonGetRequests: string[] = [];
      page.on("request", (req) => {
        if (req.method() !== "GET") nonGetRequests.push(`${req.method()} ${req.url()}`);
      });

      try {
        await gotoBoard(page);
        const card = cardFor(page, KANBAN_APPROVE_BP_RUN_ID);
        await expect(card).toBeVisible({ timeout: 15_000 });

        // Expand the Answer section: it mounts the EXISTING BreakpointApproval
        // component unchanged (the only write path).
        await card.getByTestId("kanban-bp-answer-toggle").click();
        const approval = card.getByTestId("breakpoint-approval");
        await expect(approval).toBeVisible();

        // Submit an option (option buttons submit directly in BreakpointApproval).
        await approval.getByTestId("option-btn-approve").click();
        await expect(card.getByTestId("approval-result")).toBeVisible({ timeout: 15_000 });

        // Same on-disk assertions as the approve flow: result.json written...
        //
        // DOCUMENTED FROZEN-ASSERTION CORRECTION (the only one in this file):
        // the frozen draft asserted a top-level `result.answer`, but the
        // SPEC-protected approveBreakpoint server action (SPEC §9: "No
        // changes to ... approve-breakpoint.ts"; contract: the ONLY write
        // path, reused unchanged) writes the SDK-compatible D1 shape
        //   { status: "ok", value: { approved, answer, ... }, startedAt, finishedAt }
        // — `value.approved: true` is what the babysitter runtime reads to
        // distinguish approval from rejection. The SPEC outranks the frozen
        // draft's assumed shape; AC-15's intent (the approval is recorded on
        // disk exactly as the existing approve flow records it) is asserted
        // against the real shape. Corrected, not weakened.
        const result = JSON.parse(await fs.readFile(resultPath, "utf-8"));
        expect(result.status).toBe("ok");
        expect(result.value.approved).toBe(true);
        expect(result.value.answer).toBe("approve");

        // ...and an EFFECT_RESOLVED journal entry appended.
        const journalAfter = await fs.readdir(journalDir);
        const newEntries = journalAfter.filter((f) => !journalBefore.includes(f));
        expect(newEntries.length).toBe(1);
        const entry = JSON.parse(await fs.readFile(path.join(journalDir, newEntries[0]), "utf-8"));
        expect(entry.type).toBe("EFFECT_RESOLVED");
        expect(entry.data.effectId).toBe(KANBAN_APPROVE_BP_EFFECT_ID);

        // No other network write occurred: every non-GET request is a POST to
        // the app itself (the server action), never a REST endpoint.
        expect(nonGetRequests.length).toBeGreaterThanOrEqual(1);
        for (const req of nonGetRequests) {
          expect(req, "only the server-action POST may write").toMatch(/^POST http:\/\/localhost:\d+\/(?:$|\?)/);
        }
      } finally {
        // Restore the fixture to its pending state for other tests/workers.
        const journalAfter = await fs.readdir(journalDir).catch(() => [] as string[]);
        for (const f of journalAfter) {
          if (!journalBefore.includes(f)) await fs.unlink(path.join(journalDir, f)).catch(() => {});
        }
        await fs.unlink(resultPath).catch(() => {});
      }
    }
  );

  test(
    `AC-16: an orphaned-driver Needs-you card shows the "No live driver. Resume to answer" hint and a working copy-run-id control (${PENDING_IMPL})`,
    async ({ page, context }) => {
      // 01KTESTPENDINGBPFIXTURE0 has no run.lock => driver "none" => orphaned.
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await gotoBoard(page);

      const card = cardFor(page, PENDING_BP_RUN_ID);
      await expect(card).toBeVisible({ timeout: 15_000 });
      await expect(column(page, "needsyou").locator(`[data-run-id="${PENDING_BP_RUN_ID}"]`)).toBeVisible();

      // Driver-aware informing hint (exact copy from run-list.tsx ActionHint).
      await expect(card).toContainText("No live driver. Resume to answer");
      await expect(card).not.toContainText("Answer in terminal");

      // Copy control puts the FULL runId on the clipboard.
      await card.getByRole("button", { name: /copy run id/i }).click();
      const clipboard = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboard).toBe(PENDING_BP_RUN_ID);
    }
  );

  test(
    `AC-17: clicking a card outside its interactive children navigates to /runs/{runId} (${PENDING_IMPL})`,
    async ({ page }) => {
      await gotoBoard(page);
      const firstCard = page.locator('[data-testid="kanban-card"]').first();
      await expect(firstCard).toBeVisible({ timeout: 15_000 });
      const runId = await firstCard.getAttribute("data-run-id");
      expect(runId).toBeTruthy();

      // Click the card body (stretched-overlay Link pattern) — not a button.
      await firstCard.click({ position: { x: 10, y: 10 } });
      await page.waitForURL(`**/runs/${runId}`, { timeout: 15_000 });
    }
  );

  test(
    `AC-18: resolving a breakpoint on disk moves the card out of Needs you within 10s via SSE, without a page reload (${PENDING_IMPL})`,
    async ({ page }) => {
      // Fixture prerequisite: KANBAN_SSE_BP_RUN_ID — a dedicated pending
      // breakpoint run this test resolves on disk (and restores afterwards).
      let createdFiles: string[] = [];
      try {
        await gotoBoard(page);
        await expect(
          column(page, "needsyou").locator(`[data-run-id="${KANBAN_SSE_BP_RUN_ID}"]`)
        ).toBeVisible({ timeout: 15_000 });

        // Marker to prove no full page reload happens.
        await page.evaluate(() => {
          (window as unknown as Record<string, unknown>).__kanbanNoReload = true;
        });

        // Resolve the breakpoint on disk the way the approve action does.
        createdFiles = await resolveBreakpointOnDisk(KANBAN_SSE_BP_RUN_ID, KANBAN_SSE_BP_EFFECT_ID);

        // Within 10s the card leaves Needs you and appears in Working or Done
        // (host remap per owner gate 2026-07-05 run 01KWRR8XAHFCDEGCRBRFHFF44W).
        await expect(
          column(page, "needsyou").locator(`[data-run-id="${KANBAN_SSE_BP_RUN_ID}"]`)
        ).toHaveCount(0, { timeout: 10_000 });
        const movedTo = column(page, "waiting")
          .locator(`[data-run-id="${KANBAN_SSE_BP_RUN_ID}"]`)
          .or(column(page, "done").locator(`[data-run-id="${KANBAN_SSE_BP_RUN_ID}"]`));
        await expect(movedTo).toBeVisible({ timeout: 10_000 });

        // No reload happened (SSE-triggered refetch only).
        const marker = await page.evaluate(
          () => (window as unknown as Record<string, unknown>).__kanbanNoReload
        );
        expect(marker).toBe(true);
      } finally {
        for (const f of createdFiles) await fs.unlink(f).catch(() => {});
      }
    }
  );
});

// ---------------------------------------------------------------------------
// UX-R2 §13.1 — question-shape fix (AC-33, AC-34). NEW acceptance criteria
// authored with the fix wave (not amendments to frozen §10 assertions).
// ---------------------------------------------------------------------------

test.describe("Kanban board — UX-R2 §13.1 breakpoint question shape", () => {
  test(
    "AC-33: an evidence-shape (metadata.payload) breakpoint card shows the payload title and full question — never a bare 'Approval required'",
    async ({ page }) => {
      await gotoBoard(page);

      const card = cardFor(page, KANBAN_PAYLOAD_BP_RUN_ID);
      await expect(card).toBeVisible({ timeout: 15_000 });
      await expect(
        column(page, "needsyou").locator(`[data-run-id="${KANBAN_PAYLOAD_BP_RUN_ID}"]`)
      ).toBeVisible();

      // metadata.payload.title renders as the breakpoint panel's heading.
      await expect(card.getByTestId("kanban-bp-title")).toHaveText(PAYLOAD_BP_TITLE, {
        timeout: 15_000,
      });

      // The full multi-line payload question renders (distinctive substring —
      // the text the old parser never read off disk).
      await expect(card).toContainText(PAYLOAD_BP_QUESTION_MARKER);

      // The string "Approval required" appears nowhere on this card.
      const cardText = (await card.textContent()) ?? "";
      expect(cardText).not.toContain("Approval required");
    }
  );

  test(
    "AC-35: an SDK 6.0.2 (.breakpoint) breakpoint card shows the task-def title, full question and options (as answer-panel buttons, de-duped) — never the fallback copy",
    async ({ page }) => {
      await gotoBoard(page);

      const card = cardFor(page, KANBAN_TASKDEF_BP_RUN_ID);
      await expect(card).toBeVisible({ timeout: 15_000 });
      await expect(
        column(page, "needsyou").locator(`[data-run-id="${KANBAN_TASKDEF_BP_RUN_ID}"]`)
      ).toBeVisible();

      // The task definition's own title renders as the panel heading (the
      // .breakpoint block carries no title of its own).
      await expect(card.getByTestId("kanban-bp-title")).toHaveText(TASKDEF_BP_TITLE, {
        timeout: 15_000,
      });

      // The .breakpoint question renders (distinctive substring — the text
      // the pre-fix resolver never read off disk).
      await expect(card).toContainText(TASKDEF_BP_QUESTION_MARKER);

      // UX-R3 §14.3 / AC-55: options are de-duped — no gold chips; they render
      // exactly once as the neutral buttons in the expandable answer panel.
      await expect(card.getByTestId("kanban-bp-option-chip")).toHaveCount(0);
      await card.getByTestId("kanban-bp-answer-toggle").click();
      const approval = card.getByTestId("breakpoint-approval");
      await expect(approval).toBeVisible();
      for (const option of TASKDEF_BP_OPTIONS) {
        await expect(approval.getByTestId(`option-btn-${option}`)).toHaveCount(1);
      }

      // The fallback copy ("Approval required …") appears nowhere on this card.
      const cardText = (await card.textContent()) ?? "";
      expect(cardText).not.toContain("Approval required");
    }
  );

  test(
    "AC-34: a genuinely question-less breakpoint card shows the honest fallback copy verbatim, and the Answer flow still works",
    async ({ page }) => {
      // This test answers the breakpoint through the real approve flow, so it
      // restores the fixture to its pending state afterwards (AC-15 pattern —
      // fixtures are never left mutated).
      const dir = runDir(KANBAN_NOQUEST_BP_RUN_ID);
      const resultPath = path.join(dir, "tasks", KANBAN_NOQUEST_BP_EFFECT_ID, "result.json");
      const journalDir = path.join(dir, "journal");
      const journalBefore = await fs.readdir(journalDir);

      try {
        await gotoBoard(page);

        const card = cardFor(page, KANBAN_NOQUEST_BP_RUN_ID);
        await expect(card).toBeVisible({ timeout: 15_000 });
        await expect(
          column(page, "needsyou").locator(`[data-run-id="${KANBAN_NOQUEST_BP_RUN_ID}"]`)
        ).toBeVisible();

        // Honest last-resort copy, verbatim (AC-32) — never a bare
        // "Approval required" that implies a generic approval.
        await expect(card).toContainText(NOQUEST_FALLBACK_COPY, { timeout: 15_000 });

        // The fallback never blocks answering: expand the Answer section and
        // submit a custom answer through the existing approve flow.
        await card.getByTestId("kanban-bp-answer-toggle").click();
        const approval = card.getByTestId("breakpoint-approval");
        await expect(approval).toBeVisible();
        await approval.getByTestId("custom-answer-input").fill("acknowledged");
        await approval.getByTestId("approve-btn").click();
        await expect(card.getByTestId("approval-result")).toBeVisible({ timeout: 15_000 });

        // The answer landed on disk through the one write path.
        const result = JSON.parse(await fs.readFile(resultPath, "utf-8"));
        expect(result.status).toBe("ok");
        expect(result.value.answer).toBe("acknowledged");
      } finally {
        // Restore the fixture to its pending state for other tests/workers.
        const journalAfter = await fs.readdir(journalDir).catch(() => [] as string[]);
        for (const f of journalAfter) {
          if (!journalBefore.includes(f)) await fs.unlink(path.join(journalDir, f)).catch(() => {});
        }
        await fs.unlink(resultPath).catch(() => {});
      }
    }
  );
});

// ---------------------------------------------------------------------------
// hiddenProjects, junk dirs, empty & overflow states
// ---------------------------------------------------------------------------

test.describe("Kanban board — hidden projects, junk, empty & overflow (SPEC-vibekanban)", () => {
  test(
    `AC-19: hidden-project breakpoints stay on the Needs-you alarm surface (marked), other hidden runs appear in no column, counts agree (${PENDING_IMPL})`,
    async ({ page }) => {
      // Fixture prerequisite: registry hiddenProjects includes
      // "kanban-hidden-project", which has HIDDEN_BP_RUN_ID (pending breakpoint)
      // and HIDDEN_PLAIN_RUN_ID (plain waiting run).
      await gotoBoard(page);

      // The hidden project's breakpoint run IS in Needs you, with the hidden marker.
      const bpCard = column(page, "needsyou").locator(`[data-run-id="${HIDDEN_BP_RUN_ID}"]`);
      await expect(bpCard).toBeVisible({ timeout: 15_000 });
      await expect(bpCard.locator('[title="project hidden from grid"]')).toBeVisible();

      // The hidden project's NON-breakpoint run appears in NO column.
      await expect(cardFor(page, HIDDEN_PLAIN_RUN_ID)).toHaveCount(0);

      // Invariant: Needs-you column count === needs-you pill count === counts-banner approvals.
      // owner 2026-07-07: deduped needs-you surface — top list removed; alarm =
      // counts banner + kanban column. The removed top list's per-run link count
      // is replaced by the ExecutiveSummaryBanner approvals figure, which reads
      // the same reconciledCounts.needsyou source as the pill and the column, so
      // a hidden-project breakpoint counted in the column is counted in the alarm.
      const columnN = await readCount(page, "needsyou");
      const pillText = (await page.getByTestId("filter-pill-needsyou").textContent()) ?? "";
      const pillN = parseInt(pillText.match(/\d+/)?.[0] ?? "-1", 10);
      const attentionText =
        (await page.getByTestId("summary-segment-attention").textContent()) ?? "";
      const bannerN = parseInt(attentionText.match(/\d+/)?.[0] ?? "-1", 10);
      expect(pillN).toBe(columnN);
      expect(bannerN).toBe(columnN);

      // The "N hidden" indicator chip stays visible in board view.
      await expect(page.getByTestId("hidden-projects-indicator")).toBeVisible();
    }
  );

  test(
    `AC-20: junk directories (non-run dirs in a watched source) get no card in any column and are excluded from counts (${PENDING_IMPL})`,
    async ({ page }) => {
      // Self-contained junk fixture: a directory with no journal/ and no
      // run.json inside the watched fixture source.
      const junkName = "kanban-junk-dir-not-a-run";
      const junkDir = path.join(FIXTURES_RUNS_DIR, junkName);
      try {
        await fs.mkdir(junkDir, { recursive: true });
        await fs.writeFile(path.join(junkDir, "stray.txt"), "not a run\n");

        await gotoBoard(page);

        // No card anywhere references the junk dir.
        await expect(
          page.locator(`[data-testid="kanban-card"][data-run-id*="${junkName}"]`)
        ).toHaveCount(0);

        // Board counts exclude it: total card count across visible columns
        // equals the sum of the column header counts (no phantom entries).
        // §15.1 AC-77 (owner gate 2026-07-06b): sum EVERY board column,
        // INCLUDING the Scheduled column — a run parked at an unresolved sleep
        // effect lives there, so excluding it drops it from the board total.
        let headerSum = 0;
        for (const key of TOTAL_COLUMN_KEYS) {
          if ((await column(page, key).count()) === 0) continue;
          headerSum += await readCount(page, key);
        }
        const totalCards = await page.locator('[data-testid="kanban-card"]').count();
        expect(totalCards).toBeLessThanOrEqual(headerSum); // virtualization may render fewer
        expect(headerSum).toBe(manifest.runCount + 0 /* junk contributes nothing */);
      } finally {
        await fs.rm(junkDir, { recursive: true, force: true }).catch(() => {});
      }
    }
  );

  test(
    `AC-21: empty board renders the shared EmptyState; a populated board shows the per-column "all clear" placeholder in Needs you (${PENDING_IMPL})`,
    async ({ page }) => {
      // Zero runs at all => shared EmptyState, full width, no column skeletons.
      await interceptRuns(page, []);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await expect(page.getByTestId("empty-state")).toBeVisible({ timeout: 30_000 });
      await expect(page.locator('[data-testid="kanban-board"] .animate-pulse')).toHaveCount(0);
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);

      // Runs only in Working => Needs-you renders its quiet placeholder.
      await page.unroute("**/api/runs?*");
      await interceptRuns(page, [makeApiRun({ runId: "01KSYNTHONLYWORKING00001" })]);
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(board(page)).toBeVisible({ timeout: 30_000 });
      await expect(column(page, "needsyou")).toContainText("Nothing needs you. All clear.");
      expect(await readCount(page, "needsyou")).toBe(0);
      await expect(cardsIn(page, "waiting")).toHaveCount(1);
    }
  );

  test(
    // Column host amended per owner gate 2026-07-05 run
    // 01KWRR8XAHFCDEGCRBRFHFF44W: completed runs render in the Done column.
    `AC-22: a 40-run Done column scrolls independently and virtualizes (fewer DOM cards than its header count of 40) (${PENDING_IMPL})`,
    async ({ page }) => {
      const runs = Array.from({ length: 40 }, (_, i) =>
        makeApiRun({
          runId: `01KSYNTHDONE${String(i).padStart(12, "0")}`,
          status: "completed",
          completedTasks: 4,
          updatedAt: new Date(Date.now() - i * 60_000).toISOString(),
        })
      );
      await interceptRuns(page, runs);
      await gotoBoard(page);

      // Header count is honest: 40.
      expect(await readCount(page, "done")).toBe(40);

      // Virtualization active above threshold 15: fewer DOM cards than 40.
      const domCards = await cardsIn(page, "done").count();
      expect(domCards).toBeGreaterThan(0);
      expect(domCards).toBeLessThan(40);

      // The column's card container scrolls independently (not the page body).
      const container = page.getByTestId("kanban-column-cards-done");
      const { scrollHeight, clientHeight } = await container.evaluate((el) => ({
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      }));
      expect(scrollHeight).toBeGreaterThan(clientHeight);
      const bodyOverflow = await page.evaluate(
        () => document.body.scrollHeight - window.innerHeight
      );
      // Scrolling 40 cards must not be delegated to the page body.
      expect(scrollHeight - clientHeight).toBeGreaterThan(bodyOverflow);
    }
  );
});

// ---------------------------------------------------------------------------
// Pill focus, keyboard & a11y
// ---------------------------------------------------------------------------

test.describe("Kanban board — pill focus & keyboard (SPEC-vibekanban)", () => {
  test(
    // Pill→column mapping amended per owner gate 2026-07-05 run
    // 01KWRR8XAHFCDEGCRBRFHFF44W: pills keep the six buckets; the Failed pill
    // focuses its HOST column (Done). Orphaned/Stale pills map to Stalled.
    `AC-23: clicking the Failed pill focuses/highlights its host Done column and dims the others without switching to the flat list; All restores (${PENDING_IMPL})`,
    async ({ page }) => {
      await interceptRuns(page, [
        makeApiRun({ runId: "01KSYNTHWORKING000000001" }),
        makeApiRun({ runId: "01KSYNTHFAILED0000000002", status: "failed" }),
        makeApiRun({ runId: "01KSYNTHDONE000000000003", status: "completed", completedTasks: 4 }),
      ]);
      await gotoBoard(page);

      await page.getByTestId("filter-pill-failed").click();

      // Still the board — never the flat list.
      await expect(board(page)).toBeVisible();
      await expect(page.getByTestId("run-list-flat")).toHaveCount(0);

      // The host Done column is highlighted and in view; other columns dimmed.
      const doneCol = column(page, "done");
      await expect(doneCol).toHaveAttribute("data-focused", "true");
      await expect(doneCol).toBeInViewport();
      await expect(column(page, "waiting")).toHaveAttribute("data-dimmed", "true");
      await expect(column(page, "needsyou")).toHaveAttribute("data-dimmed", "true");

      // "All" clears the focus.
      await page.getByTestId("filter-pill-all").click();
      await expect(doneCol).not.toHaveAttribute("data-focused", "true");
      await expect(column(page, "waiting")).not.toHaveAttribute("data-dimmed", "true");
    }
  );

  test(
    "AC-24: roving tabindex — ArrowDown moves within the column, ArrowRight jumps to the adjacent column, Enter opens the focused run",
    async ({ page }) => {
      await interceptRuns(page, [
        makeApiRun({ runId: "01KSYNTHBPA0000000000001", pendingBreakpoints: 1 }),
        makeApiRun({ runId: "01KSYNTHBPB0000000000002", pendingBreakpoints: 1 }),
        makeApiRun({ runId: "01KSYNTHORPHA00000000003", driver: "orphaned" }),
        makeApiRun({ runId: "01KSYNTHORPHB00000000004", driver: "orphaned" }),
      ]);
      await gotoBoard(page);

      const focusedRunId = () =>
        page.evaluate(() =>
          document.activeElement
            ?.closest('[data-testid="kanban-card"]')
            ?.getAttribute("data-run-id") ??
          document.activeElement?.getAttribute("data-run-id") ??
          null
        );

      // Focus the first Needs-you card.
      const first = cardsIn(page, "needsyou").first();
      await expect(first).toBeVisible();
      await first.focus();

      const needsyouIds = await cardsIn(page, "needsyou").evaluateAll((els) =>
        els.map((el) => el.getAttribute("data-run-id"))
      );
      expect(await focusedRunId()).toBe(needsyouIds[0]);

      // ArrowDown => next card in the same column.
      await page.keyboard.press("ArrowDown");
      expect(await focusedRunId()).toBe(needsyouIds[1]);

      // ArrowRight => same index in the adjacent non-empty column (Stalled —
      // host remap per owner gate 2026-07-05 run 01KWRR8XAHFCDEGCRBRFHFF44W;
      // the empty Working column in between is skipped).
      await page.keyboard.press("ArrowRight");
      const stalledIds = await cardsIn(page, "stalled").evaluateAll((els) =>
        els.map((el) => el.getAttribute("data-run-id"))
      );
      const landedOn = await focusedRunId();
      expect(landedOn).toBe(stalledIds[1]);

      // Enter => opens the focused card's run page.
      await page.keyboard.press("Enter");
      await page.waitForURL(`**/runs/${landedOn}`, { timeout: 15_000 });
    }
  );
});

// ---------------------------------------------------------------------------
// UX-R2 §13.2b / §13.3 — taxonomy compensations & semantic color system
// (AC-36, AC-37, AC-40..AC-42). NEW acceptance criteria implemented per owner
// gate 2026-07-05 run 01KWRR8XAHFCDEGCRBRFHFF44W: 4-column taxonomy + color map.
// ---------------------------------------------------------------------------

/** Resolve any CSS color expression (e.g. "var(--status-failed)") to the
 *  browser's computed rgb() string on the current theme. */
async function resolveCssColor(page: Page, cssColor: string): Promise<string> {
  return page.evaluate((value) => {
    const el = document.createElement("span");
    el.style.color = value;
    document.body.appendChild(el);
    const resolved = getComputedStyle(el).color;
    el.remove();
    return resolved;
  }, cssColor);
}

/** Computed color of the first element matching a selector. */
async function computedColor(page: Page, selector: string): Promise<string> {
  return page.locator(selector).first().evaluate((el) => getComputedStyle(el).color);
}

/** Mixed-bucket fixture: 1 needs-you, 1 working, 1 orphaned, 1 stale,
 *  2 failed, 3 completed (AC-36 chip math shape). */
function mixedBucketRuns(): Record<string, unknown>[] {
  return [
    makeApiRun({ runId: "01KSYNTHUXRBP00000000001", pendingBreakpoints: 1 }),
    makeApiRun({ runId: "01KSYNTHUXRWORK000000002" }),
    makeApiRun({ runId: "01KSYNTHUXRORPH000000003", driver: "none" }),
    makeApiRun({ runId: "01KSYNTHUXRSTALE00000004", isStale: true }),
    makeApiRun({ runId: "01KSYNTHUXRFAILA00000005", status: "failed" }),
    makeApiRun({ runId: "01KSYNTHUXRFAILB00000006", status: "failed" }),
    makeApiRun({ runId: "01KSYNTHUXRDONEA00000007", status: "completed", completedTasks: 4 }),
    makeApiRun({ runId: "01KSYNTHUXRDONEB00000008", status: "completed", completedTasks: 4 }),
    makeApiRun({ runId: "01KSYNTHUXRDONEC00000009", status: "completed", completedTasks: 4 }),
  ];
}

test.describe("Kanban board — UX-R2 §13.2b/§13.3 taxonomy & color (owner gate 2026-07-05)", () => {
  test("AC-36: Stalled cards carry exactly one recoverability badge; Done failed cards keep the failed badge and the header shows the 'N failed' chip iff N>0", async ({ page }) => {
    await interceptRuns(page, mixedBucketRuns());
    await gotoBoard(page);

    // Stalled hosts the orphaned + stale buckets, in that order.
    await expect(cardsIn(page, "stalled")).toHaveCount(2);

    // Orphaned-bucket card: the "no driver" resume hint, and NO quiet badge.
    const orphanedCard = cardFor(page, "01KSYNTHUXRORPH000000003");
    await expect(orphanedCard.getByTestId("run-action-hint")).toBeVisible();
    await expect(orphanedCard).toContainText("No live driver. Resume to answer");
    await expect(orphanedCard.getByTestId("kanban-quiet-badge")).toHaveCount(0);

    // Stale-bucket card: the "quiet" badge, and NO no-driver hint.
    const staleCard = cardFor(page, "01KSYNTHUXRSTALE00000004");
    await expect(staleCard.getByTestId("kanban-quiet-badge")).toBeVisible();
    await expect(staleCard.getByTestId("kanban-quiet-badge")).toContainText("Quiet");
    await expect(staleCard.getByTestId("run-action-hint")).toHaveCount(0);

    // Done: failed cards carry the failed badge (StatusDot failed variant).
    const failedCard = cardFor(page, "01KSYNTHUXRFAILA00000005");
    await expect(failedCard.locator('[data-status-badge]')).toContainText("failed");

    // Done header chip: exact "2 failed" for the 2-failed + 3-completed fixture.
    const chip = page.getByTestId("kanban-done-failed-chip");
    await expect(chip).toBeVisible();
    await expect(chip).toHaveText(/^\s*2 failed\s*$/);

    // ...and iff N>0: with no failed runs the chip is absent.
    await page.unroute("**/api/runs?*");
    await interceptRuns(page, [
      makeApiRun({ runId: "01KSYNTHUXRDONEA00000007", status: "completed", completedTasks: 4 }),
    ]);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(board(page)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("kanban-done-failed-chip")).toHaveCount(0);
  });

  test("AC-37: every column header has a keyboard-reachable '?' affordance opening one-line definitions of the board columns", async ({ page }) => {
    await interceptRuns(page, mixedBucketRuns());
    await gotoBoard(page);

    // Every visible column header renders the affordance.
    for (const key of COLUMN_KEYS) {
      await expect(page.getByTestId(`kanban-column-info-${key}`)).toBeVisible();
    }

    // Keyboard-reachable: focus the affordance and open it with Enter.
    const info = page.getByTestId("kanban-column-info-needsyou");
    await info.focus();
    await page.keyboard.press("Enter");
    const definitions = page.getByTestId("kanban-column-definitions");
    await expect(definitions).toBeVisible();

    // One line per column, plain language (§13.2 column meanings).
    await expect(definitions).toContainText("Needs you: a run is waiting for YOUR answer.");
    await expect(definitions).toContainText("Working: a live driver is attached and making progress.");
    await expect(definitions).toContainText(
      "Stalled and recoverable: no live driver or quiet >1h; resume to continue."
    );
    await expect(definitions).toContainText(
      "Done and terminal: completed or failed; failed runs carry a red failed badge."
    );

    // Escape closes the popover.
    await page.keyboard.press("Escape");
    await expect(definitions).toHaveCount(0);
  });

  test("AC-40: red is terminal-only — Stalled surfaces never resolve --status-failed; the failed chip and failed badges do", async ({ page }) => {
    await interceptRuns(page, mixedBucketRuns());
    await gotoBoard(page);
    await expect(cardsIn(page, "stalled")).toHaveCount(2);

    const failedColor = await resolveCssColor(page, "var(--status-failed)");
    const stalledColor = await resolveCssColor(page, "var(--status-stalled)");

    // Stalled header label: the stalled token, never failure red.
    const stalledHeader = await computedColor(page, '[data-testid="kanban-column-label-stalled"]');
    expect(stalledHeader).toBe(stalledColor);
    expect(stalledHeader).not.toBe(failedColor);

    // No status badge on any Stalled card resolves to failure red.
    const stalledBadgeColors = await page
      .locator('[data-testid="kanban-column-stalled"] [data-status-badge]')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).color));
    expect(stalledBadgeColors.length).toBeGreaterThan(0);
    for (const color of stalledBadgeColors) expect(color).not.toBe(failedColor);

    // --status-failed resolves ONLY on failed-run surfaces: the Done header
    // "N failed" chip and the failed cards' badges.
    expect(await computedColor(page, '[data-testid="kanban-done-failed-chip"]')).toBe(failedColor);
    const failedBadge = cardFor(page, "01KSYNTHUXRFAILA00000005").locator("[data-status-badge]");
    expect(await failedBadge.evaluate((el) => getComputedStyle(el).color)).toBe(failedColor);

    // Needs-you / Working headers carry their own hues — never red.
    for (const key of ["needsyou", "waiting"] as const) {
      const color = await computedColor(page, `[data-testid="kanban-column-label-${key}"]`);
      expect(color, `${key} header is not red`).not.toBe(failedColor);
    }
  });

  test("AC-41: never color-alone — every rendered status badge/chip on the board pairs an icon with a text label", async ({ page }) => {
    await interceptRuns(page, mixedBucketRuns());
    await gotoBoard(page);
    await expect(cardsIn(page, "stalled")).toHaveCount(2);

    const badges = await page
      .locator('[data-testid="kanban-board"] [data-status-badge]')
      .evaluateAll((els) =>
        els.map((el) => ({
          text: (el.textContent ?? "").trim(),
          hasIcon: el.querySelector('svg, [aria-hidden="true"]') !== null,
        }))
      );
    // The fixture populates every column: liveness chips, quiet badge, resume
    // hint, status dots, the Done failed chip, and the NEEDS YOU panel label.
    expect(badges.length).toBeGreaterThanOrEqual(6);
    for (const badge of badges) {
      expect(badge.text, "badge has a text label").not.toBe("");
      expect(badge.hasIcon, `badge "${badge.text}" has an icon`).toBe(true);
    }
  });

  test("AC-42: --status-ok resolves on the all-clear empty state and never on Needs-you/Working/Stalled headers", async ({ page }) => {
    // Only a working run: Needs-you renders its all-clear placeholder.
    await interceptRuns(page, [makeApiRun({ runId: "01KSYNTHUXRONLYWORK00001" })]);
    await gotoBoard(page);

    const okColor = await resolveCssColor(page, "var(--status-ok)");
    const allClear = page.getByText("Nothing needs you. All clear.");
    await expect(allClear).toBeVisible();
    expect(await allClear.evaluate((el) => getComputedStyle(el).color)).toBe(okColor);

    // Non-terminal column headers never resolve the succeeded/healthy green.
    for (const key of ["needsyou", "waiting", "done"] as const) {
      const color = await computedColor(page, `[data-testid="kanban-column-label-${key}"]`);
      expect(color, `${key} header is not --status-ok`).not.toBe(okColor);
    }
  });
});

// ---------------------------------------------------------------------------
// UX-R2 §13.4 read-only clarity + §13.5 folded-in design-QA carries
// (AC-43..AC-49). NEW acceptance criteria — taxonomy-independent per §13.6,
// implemented in the wave-3 pass (owner gate 2026-07-05 run
// 01KWRR8XAHFCDEGCRBRFHFF44W). New testids introduced by this wave:
//   - [data-testid="bp-readonly-contract"]           §13.4 contract line (board panel + run-detail)
//   - [data-testid="bp-orphaned-semantics"]          §13.4 orphaned semantics line
//   - [data-testid="kanban-bp-needsyou-label"]       the panel's NEEDS YOU alarm label (AC-46)
//   - [data-testid="kanban-card-project-name"]       inner truncating project-name span (AC-48)
//   - [data-testid="kanban-absorbed-<key>"]   sr-only absorbed-count disclosure (AC-49)
// ---------------------------------------------------------------------------

// §13.4 exact copy — these strings are spec, not suggestions (frozen VERBATIM).
const READONLY_CONTRACT_LINE =
  "The observer is read-only, except this single action: recording your breakpoint answer.";
const ORPHANED_SEMANTICS_LINE =
  "Recorded to disk. Nothing runs until you resume:";
const ORPHANED_RECORDED_CONFIRMATION =
  "Answer recorded. It will be applied when the run is resumed.";

// The pending breakpoint effect inside 01KTESTPENDINGBPFIXTURE0 (see
// breakpoints.spec.ts — the shared fixture is read-only in this spec).
const PENDING_BP_EFFECT_ID = "01KTEST_BP_EFFECT_001";

/** Intercept BOTH /api/runs consumers: mode=projects (pill counts) and the
 *  board's list fetch — needed when a test asserts pills AND columns (AC-47). */
async function interceptRunsAndProjects(
  page: Page,
  runs: Record<string, unknown>[],
  projects: Record<string, unknown>[]
) {
  await page.route("**/api/runs?*", (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get("mode") === "projects") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ projects, recentCompletionWindowMs: 14_400_000 }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ runs, totalCount: runs.length }),
    });
  });
}

test.describe("Kanban board — UX-R2 §13.4 read-only clarity (owner gate 2026-07-05)", () => {
  test("AC-43: every breakpoint answer panel — board card AND run-detail — renders the contract line verbatim above any input", async ({ page }) => {
    // Board card: the contract line is visible while the Answer section is
    // still collapsed (above any input by construction).
    await gotoBoard(page);
    const card = cardFor(page, PENDING_BP_RUN_ID);
    await expect(card).toBeVisible({ timeout: 15_000 });
    const boardContract = card.getByTestId("bp-readonly-contract");
    await expect(boardContract).toBeVisible();
    await expect(boardContract).toHaveText(READONLY_CONTRACT_LINE);
    await expect(card.getByTestId("custom-answer-input")).toHaveCount(0);

    // Run-detail: open the pending breakpoint task's Approval panel.
    await page.goto(`/runs/${PENDING_BP_RUN_ID}`, { waitUntil: "domcontentloaded" });
    const stepCard = page.locator(`[data-testid="step-card-${PENDING_BP_EFFECT_ID}"]`);
    await expect(stepCard).toBeVisible({ timeout: 15_000 });
    await stepCard.locator("button").first().click();

    const panel = page.getByTestId("breakpoint-panel");
    await expect(panel).toBeVisible({ timeout: 15_000 });
    const detailContract = panel.getByTestId("bp-readonly-contract");
    await expect(detailContract).toHaveText(READONLY_CONTRACT_LINE);
    // ...above any input: the contract line precedes the answer input in DOM order.
    const contractBeforeInput = await panel.evaluate((el) => {
      const contract = el.querySelector('[data-testid="bp-readonly-contract"]');
      const input = el.querySelector('[data-testid="custom-answer-input"]');
      if (!contract || !input) return false;
      return Boolean(
        contract.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING
      );
    });
    expect(contractBeforeInput, "contract line renders above the answer input").toBe(true);
  });

  test("AC-44: orphaned card shows the semantics line before any interaction and keeps the input out of the accessible tree until expanded; live-driver cards get no new collapse", async ({ page }) => {
    // Orphaned/no-driver fixture (01KTESTPENDINGBPFIXTURE0 has no run.lock).
    await gotoBoard(page);
    const card = cardFor(page, PENDING_BP_RUN_ID);
    await expect(card).toBeVisible({ timeout: 15_000 });

    // Honest hint FIRST — visible before ANY interaction, exact copy.
    const semantics = card.getByTestId("bp-orphaned-semantics");
    await expect(semantics).toBeVisible();
    await expect(semantics).toHaveText(ORPHANED_SEMANTICS_LINE);

    // The answer input is NOT in the accessible tree until the toggle expands.
    await expect(card.getByTestId("custom-answer-input")).toHaveCount(0);
    const toggle = card.getByTestId("kanban-bp-answer-toggle");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(card.getByTestId("custom-answer-input")).toBeAttached({ timeout: 15_000 });

    // Live-driver fixture (synthesized): base-branch behavior — the collapsed
    // Answer toggle as before, and NO orphaned-semantics line.
    await interceptRuns(page, [
      makeApiRun({
        runId: "01KSYNTHLIVEBPRUN0000001",
        pendingBreakpoints: 1,
        driver: "live",
        breakpointQuestion: "Deploy the synthesized live-driver fixture?",
        tasks: [
          {
            effectId: "01KSYNTH_LIVE_BP_EFFECT1",
            kind: "breakpoint",
            status: "requested",
            title: "breakpoint",
            label: "breakpoint",
          },
        ],
      }),
    ]);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(board(page)).toBeVisible({ timeout: 30_000 });
    const liveCard = cardFor(page, "01KSYNTHLIVEBPRUN0000001");
    await expect(liveCard).toBeVisible();
    await expect(liveCard.getByTestId("bp-readonly-contract")).toBeVisible();
    await expect(liveCard.getByTestId("bp-orphaned-semantics")).toHaveCount(0);
    await expect(liveCard.getByTestId("kanban-bp-answer-toggle")).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  test("AC-45: answering an orphaned run shows the post-submit confirmation verbatim, and the write is the same approve-flow write (result.json + EFFECT_RESOLVED) with no other write", async ({ page }) => {
    // Same dedicated fixture + restore discipline as AC-15 — the fixture has
    // no run.lock, so the board classifies it orphaned (driver "none").
    const dir = runDir(KANBAN_APPROVE_BP_RUN_ID);
    const resultPath = path.join(dir, "tasks", KANBAN_APPROVE_BP_EFFECT_ID, "result.json");
    const journalDir = path.join(dir, "journal");
    const journalBefore = await fs.readdir(journalDir);

    const nonGetRequests: string[] = [];
    page.on("request", (req) => {
      if (req.method() !== "GET") nonGetRequests.push(`${req.method()} ${req.url()}`);
    });

    try {
      await gotoBoard(page);
      const card = cardFor(page, KANBAN_APPROVE_BP_RUN_ID);
      await expect(card).toBeVisible({ timeout: 15_000 });

      // §13.4 order on an orphaned card: contract line, semantics line, THEN
      // the collapsed Answer toggle.
      await expect(card.getByTestId("bp-readonly-contract")).toBeVisible();
      await expect(card.getByTestId("bp-orphaned-semantics")).toBeVisible();

      await card.getByTestId("kanban-bp-answer-toggle").click();
      const approval = card.getByTestId("breakpoint-approval");
      await expect(approval).toBeVisible();
      await approval.getByTestId("option-btn-approve").click();

      // Post-submit confirmation, exact §13.4 copy — never the generic
      // "approved successfully" line on an orphaned run.
      const result = card.getByTestId("approval-result");
      await expect(result).toBeVisible({ timeout: 15_000 });
      await expect(result).toContainText(ORPHANED_RECORDED_CONFIRMATION);
      await expect(result).not.toContainText("approved successfully");

      // Byte-identical write effect to the run-detail approve (AC-15 shape):
      // result.json in the SDK-compatible D1 shape...
      const resultJson = JSON.parse(await fs.readFile(resultPath, "utf-8"));
      expect(resultJson.status).toBe("ok");
      expect(resultJson.value.approved).toBe(true);
      expect(resultJson.value.answer).toBe("approve");

      // ...plus exactly one EFFECT_RESOLVED journal entry.
      const journalAfter = await fs.readdir(journalDir);
      const newEntries = journalAfter.filter((f) => !journalBefore.includes(f));
      expect(newEntries.length).toBe(1);
      const entry = JSON.parse(await fs.readFile(path.join(journalDir, newEntries[0]), "utf-8"));
      expect(entry.type).toBe("EFFECT_RESOLVED");
      expect(entry.data.effectId).toBe(KANBAN_APPROVE_BP_EFFECT_ID);

      // No other write occurs: every non-GET request is the server-action POST.
      expect(nonGetRequests.length).toBeGreaterThanOrEqual(1);
      for (const req of nonGetRequests) {
        expect(req, "only the server-action POST may write").toMatch(/^POST http:\/\/localhost:\d+\/(?:$|\?)/);
      }
    } finally {
      // Restore the fixture to its pending state for other tests/workers.
      const journalAfter = await fs.readdir(journalDir).catch(() => [] as string[]);
      for (const f of journalAfter) {
        if (!journalBefore.includes(f)) await fs.unlink(path.join(journalDir, f)).catch(() => {});
      }
      await fs.unlink(resultPath).catch(() => {});
    }
  });
});

test.describe("Kanban board — UX-R2 §13.5 carried minors & nits (owner gate 2026-07-05)", () => {
  test("AC-46: the NEEDS YOU alarm label resolves the AA-safe attention ink in light theme (#7e6400), never raw warning gold (#D4AF00)", async ({ page }) => {
    await gotoBoard(page);
    const card = cardFor(page, PENDING_BP_RUN_ID);
    await expect(card).toBeVisible({ timeout: 15_000 });

    // Flip to light theme (the CSS tokens key off html[data-theme="light"]).
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "light");
    });

    const label = card.getByTestId("kanban-bp-needsyou-label");
    await expect(label).toBeVisible();
    const labelColor = await label.evaluate((el) => getComputedStyle(el).color);
    // #7e6400 — the darkened attention ink (--status-attention, light):
    // 5.66:1 on white AND 4.73:1 on the composited error-muted banner tint
    // (live-verify 2026-07-05 superseded #8a6d00, which hit only 4.12:1 there).
    expect(labelColor).toBe("rgb(126, 100, 0)");
    // ...never the 1.6:1 raw gold (#D4AF00 = light-theme --warning).
    expect(labelColor).not.toBe("rgb(212, 175, 0)");
  });

  test("AC-47: Working column count honesty — a breakpoint run counted by the waiting pill is disclosed by the Working header's absorbed-into tooltip", async ({ page }) => {
    // Fixture per the AC: one plain working run + one non-stale breakpoint
    // run absorbed into Needs-you. The waiting PILL counts both (pill counts
    // overlap); the Working COLUMN renders only the plain run.
    await interceptRunsAndProjects(
      page,
      [
        makeApiRun({
          runId: "01KSYNTHWORKBPRUN0000001",
          pendingBreakpoints: 1,
          driver: "live",
        }),
        makeApiRun({ runId: "01KSYNTHWORKPLAIN0000002" }),
      ],
      [
        {
          projectName: "synthetic-project",
          totalRuns: 2,
          activeRuns: 2, // = the waiting pill (non-stale in-progress runs)
          completedRuns: 0,
          failedRuns: 0,
          staleRuns: 0,
          totalTasks: 8,
          completedTasksAggregate: 4,
          latestUpdate: new Date().toISOString(),
          pendingBreakpoints: 1,
          orphanedRuns: 0,
          breakpointRuns: [],
        },
      ]
    );
    await gotoBoard(page);

    // Waiting pill reads 2; the Working column reads 1.
    await expect(page.getByTestId("filter-pill-waiting")).toContainText("2");
    expect(await readCount(page, "waiting")).toBe(1);
    await expect(cardsIn(page, "waiting")).toHaveCount(1);
    await expect(cardsIn(page, "needsyou")).toHaveCount(1);

    // The Working header discloses where the difference went — same absorbed
    // tooltip mechanism as Orphaned/Stale, exact AC-47 text.
    const workingHeader = column(page, "waiting").locator(
      '[title="+1 more working run is shown under Needs you"]'
    );
    await expect(workingHeader).toBeVisible();
    await expect(page.getByTestId("kanban-absorbed-waiting")).toHaveText(
      "+1 more working run is shown under Needs you"
    );
  });

  test("AC-48: a 60-char project name ellipsizes on the inner text node without clipping the Tag icon or breaking the card layout", async ({ page }) => {
    const LONG_PROJECT = "a-very-long-project-name-that-should-ellipsize-cleanly-01234"; // 60 chars
    expect(LONG_PROJECT).toHaveLength(60);
    await interceptRuns(page, [
      makeApiRun({ runId: "01KSYNTHLONGPROJRUN00001", projectName: LONG_PROJECT }),
    ]);
    await gotoBoard(page);

    const card = cardFor(page, "01KSYNTHLONGPROJRUN00001");
    await expect(card).toBeVisible();

    // The INNER text node truncates (real ellipsis: overflow beyond clientWidth).
    const name = card.getByTestId("kanban-card-project-name");
    await expect(name).toBeVisible();
    const metrics = await name.evaluate((el) => ({
      overflow: el.scrollWidth > el.clientWidth,
      textOverflow: getComputedStyle(el).textOverflow,
    }));
    expect(metrics.textOverflow).toBe("ellipsis");
    expect(metrics.overflow, "long name actually overflows into the ellipsis").toBe(true);

    // The Tag icon is excluded from truncation — still rendered at full size.
    const iconWidth = await name.evaluate((el) => {
      const icon = el.parentElement?.querySelector("svg");
      return icon ? icon.getBoundingClientRect().width : 0;
    });
    expect(iconWidth).toBeGreaterThan(0);

    // Card layout intact: the card never grows past its 280px column.
    const cardBox = await card.boundingBox();
    const columnBox = await column(page, "waiting").boundingBox();
    expect(cardBox).not.toBeNull();
    expect(columnBox).not.toBeNull();
    expect(cardBox!.width).toBeLessThanOrEqual(columnBox!.width);
  });

  test("AC-49: every absorbed-count disclosure is aria-describedby-associated with its column header (accessible description = tooltip text)", async ({ page }) => {
    // One absorbed run per mechanism: an orphaned breakpoint run (Stalled
    // disclosure) + a live breakpoint run (Working disclosure), plus one
    // plain run in each host column.
    await interceptRuns(page, [
      makeApiRun({
        runId: "01KSYNTHA11YORPHBP000001",
        pendingBreakpoints: 1,
        driver: "none",
      }),
      makeApiRun({
        runId: "01KSYNTHA11YLIVEBP000002",
        pendingBreakpoints: 1,
        driver: "live",
      }),
      makeApiRun({ runId: "01KSYNTHA11YPLAINWK00003" }),
      makeApiRun({ runId: "01KSYNTHA11YPLAINORPH004", driver: "orphaned" }),
    ]);
    await gotoBoard(page);

    // Working header: described by the working absorbed disclosure.
    const workingLabel = page.getByTestId("kanban-column-label-waiting");
    await expect(workingLabel).toHaveAttribute(
      "aria-describedby",
      "kanban-absorbed-waiting"
    );
    await expect(workingLabel).toHaveAccessibleDescription(
      "+1 more working run is shown under Needs you"
    );

    // Stalled header: described by the stalled absorbed disclosure.
    const stalledLabel = page.getByTestId("kanban-column-label-stalled");
    await expect(stalledLabel).toHaveAttribute(
      "aria-describedby",
      "kanban-absorbed-stalled"
    );
    await expect(stalledLabel).toHaveAccessibleDescription(
      "+1 more stalled run is shown under Needs you"
    );
  });
});

// ---------------------------------------------------------------------------
// UX-R3 §14.5 — write-path truth (owner gate 2026-07-06 ruling, option a).
// NEW acceptance criteria AC-58..AC-63: the observer RECORDS an answer; it
// never performs/publishes it. Testids introduced by this wave:
//   - [data-testid="kanban-bp-recorded-chip"]     amber-gray "answer recorded — awaiting resume"
//   - [data-testid="kanban-bp-recorded-body"]     honest "nothing published yet" body
//   - [data-testid="kanban-bp-recorded-answer"]   the existing recorded answer (AC-62)
//   - [data-testid="kanban-bp-run-iterate"]       copyable, INERT run:iterate command (AC-60)
//   - [data-testid="kanban-bp-first-answer-stands"] first-answer-stands copy (AC-62;
//     review round 3 removed the overwrite toggle — answers cannot be overwritten)
// ---------------------------------------------------------------------------

// §14.5 frozen copy (verbatim).
const RECORDED_CHIP_TEXT = "Answer recorded, awaiting resume";
const RECORDED_CONFIRMATION = "Answer recorded. It will be applied when the run is resumed.";
const FORBIDDEN_CONFIRMATION_WORDS = ["published", "approved successfully", "done"];

// A synthetic run whose breakpoint the observer already answered (result on
// disk, run not yet resumed): driver "none", pending 0, recordedAwaitingResume.
const RECORDED_RUN_ID = "01KSYNTHRECORDEDBP000001";
const RECORDED_EFFECT_ID = "01KSYNTH_RECORDED_EFF_01";
const RECORDED_ANSWER = "approve";

/** Intercept the board list AND the panel's task-detail GET so a synthetic
 *  "recorded, awaiting resume" card renders without touching disk. */
async function interceptRecordedRun(page: Page) {
  await interceptRuns(page, [
    makeApiRun({
      runId: RECORDED_RUN_ID,
      status: "pending",
      driver: "none",
      pendingBreakpoints: 0,
      recordedAwaitingResume: true,
      recordedBreakpointEffectId: RECORDED_EFFECT_ID,
      breakpointQuestion: "Approve the staging deploy?",
      tasks: [
        {
          effectId: RECORDED_EFFECT_ID,
          kind: "breakpoint",
          status: "resolved",
          title: "breakpoint",
          label: "breakpoint",
        },
      ],
    }),
  ]);
  await page.route("**/api/runs/*/tasks/*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        task: {
          effectId: RECORDED_EFFECT_ID,
          kind: "breakpoint",
          title: "breakpoint",
          label: "breakpoint",
          status: "resolved",
          invocationKey: "",
          stepId: "",
          taskId: "",
          requestedAt: new Date().toISOString(),
          breakpoint: {
            question: "Approve the staging deploy?",
            title: "Approval",
            options: ["approve", "reject"],
            context: { files: [] },
          },
          result: {
            status: "ok",
            value: {
              approved: true,
              answer: RECORDED_ANSWER,
              approvedBy: "observer-dashboard",
            },
          },
        },
      }),
    })
  );
}

test.describe("Kanban board — UX-R3 §14.5 write-path truth (owner gate 2026-07-06)", () => {
  test("AC-58: every answer submit reads 'Record answer' — never 'Approve'/'Approving' (board + run-detail)", async ({
    page,
  }) => {
    // Board card (real pending fixture).
    await gotoBoard(page);
    const card = cardFor(page, PENDING_BP_RUN_ID);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.getByTestId("kanban-bp-answer-toggle").click();
    const submit = card.getByTestId("approve-btn");
    await expect(submit).toBeVisible();
    await expect(submit).toHaveText("Record answer");
    await expect(card.getByTestId("breakpoint-approval")).not.toContainText(/Approv(e|ing)/);

    // Run-detail submit control — same relabel.
    await page.goto(`/runs/${PENDING_BP_RUN_ID}`, { waitUntil: "domcontentloaded" });
    const stepCard = page.locator(`[data-testid="step-card-${PENDING_BP_EFFECT_ID}"]`);
    await expect(stepCard).toBeVisible({ timeout: 15_000 });
    await stepCard.locator("button").first().click();
    const panel = page.getByTestId("breakpoint-panel");
    await expect(panel).toBeVisible({ timeout: 15_000 });
    await expect(panel.getByTestId("approve-btn")).toHaveText("Record answer");
  });

  test("AC-59: an answered-but-unapplied run stays in Needs-you with the amber-gray recorded chip (NOT green)", async ({
    page,
  }) => {
    await interceptRecordedRun(page);
    await gotoBoard(page);

    const card = cardFor(page, RECORDED_RUN_ID);
    await expect(card).toBeVisible({ timeout: 15_000 });
    // Stays in Needs-you (never slid to Stalled).
    await expect(
      column(page, "needsyou").locator(`[data-run-id="${RECORDED_RUN_ID}"]`)
    ).toBeVisible();

    const chip = card.getByTestId("kanban-bp-recorded-chip");
    await expect(chip).toHaveText(RECORDED_CHIP_TEXT);

    // Amber-gray (--status-stalled), asserted computed — and NOT green (--status-ok).
    const chipColor = await chip.evaluate((el) => getComputedStyle(el).color);
    expect(chipColor).toBe(await resolveCssColor(page, "var(--status-stalled)"));
    expect(chipColor).not.toBe(await resolveCssColor(page, "var(--status-ok)"));

    // Honest body — nothing was published yet.
    await expect(card.getByTestId("kanban-bp-recorded-body")).toContainText(
      "Nothing was published yet"
    );
  });

  test("AC-60: the recorded card exposes a copyable, INERT run:iterate command (Copy invokes no server action)", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // Any non-GET request would be an illegal write from a read-only affordance.
    const nonGetRequests: string[] = [];
    page.on("request", (req) => {
      if (req.method() !== "GET") nonGetRequests.push(`${req.method()} ${req.url()}`);
    });

    await interceptRecordedRun(page);
    await gotoBoard(page);
    const card = cardFor(page, RECORDED_RUN_ID);
    await expect(card).toBeVisible({ timeout: 15_000 });

    const cmd = card.getByTestId("kanban-bp-run-iterate-text");
    await expect(cmd).toHaveText(`babysitter run:iterate ${RECORDED_RUN_ID}`);

    // Copy writes the command to the clipboard...
    await card.getByTestId("kanban-bp-run-iterate-copy").click();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toBe(`babysitter run:iterate ${RECORDED_RUN_ID}`);
    // ...and performs NO server action / network write (read-only contract).
    expect(nonGetRequests, `copy must not write: ${nonGetRequests.join(", ")}`).toHaveLength(0);
  });

  test("AC-61: the post-submit confirmation on an orphaned run is honest — 'recorded' + 'resumed', never 'published/approved successfully/done'", async ({
    page,
  }) => {
    // Real record on the dedicated orphaned fixture (driver "none"), restored.
    const dir = runDir(KANBAN_APPROVE_BP_RUN_ID);
    const resultPath = path.join(dir, "tasks", KANBAN_APPROVE_BP_EFFECT_ID, "result.json");
    const journalDir = path.join(dir, "journal");
    const journalBefore = await fs.readdir(journalDir);

    try {
      await gotoBoard(page);
      const card = cardFor(page, KANBAN_APPROVE_BP_RUN_ID);
      await expect(card).toBeVisible({ timeout: 15_000 });
      await card.getByTestId("kanban-bp-answer-toggle").click();
      await card.getByTestId("option-btn-approve").click();

      const result = card.getByTestId("approval-result");
      await expect(result).toBeVisible({ timeout: 15_000 });
      const text = (await result.textContent()) ?? "";
      expect(text).toContain(RECORDED_CONFIRMATION);
      expect(text.toLowerCase()).toContain("recorded");
      expect(text.toLowerCase()).toContain("resumed");
      for (const forbidden of FORBIDDEN_CONFIRMATION_WORDS) {
        expect(text.toLowerCase(), `confirmation must not claim "${forbidden}"`).not.toContain(
          forbidden
        );
      }
    } finally {
      const journalAfter = await fs.readdir(journalDir).catch(() => [] as string[]);
      for (const f of journalAfter) {
        if (!journalBefore.includes(f)) await fs.unlink(path.join(journalDir, f)).catch(() => {});
      }
      await fs.unlink(resultPath).catch(() => {});
    }
  });

  test("AC-62 (first-answer-stands): re-opening a recorded card shows the existing answer once and offers NO overwrite (the first recorded answer stands)", async ({
    page,
  }) => {
    // Review round 3 replaced the AC-62 overwrite affordance with the
    // first-answer-stands contract (the SDK commit path refuses a second
    // answer for a resolved effect), see kanban-breakpoint-panel.tsx and its
    // unit tests. This spec asserts the shipped contract.
    await interceptRecordedRun(page);
    await gotoBoard(page);
    const card = cardFor(page, RECORDED_RUN_ID);
    await expect(card).toBeVisible({ timeout: 15_000 });

    // The existing recorded answer is shown exactly once...
    const recorded = card.getByTestId("kanban-bp-recorded-answer");
    await expect(recorded).toHaveCount(1);
    await expect(recorded).toContainText(RECORDED_ANSWER);

    // ...with the honest first-answer-stands copy instead of any re-answer
    // affordance: no overwrite toggle, no remounted approval form.
    await expect(card.getByTestId("kanban-bp-first-answer-stands")).toContainText(
      "The first recorded answer stands"
    );
    await expect(card.getByTestId("kanban-bp-overwrite-toggle")).toHaveCount(0);
    await expect(card.getByTestId("breakpoint-approval")).toHaveCount(0);
    await expect(card.getByText(/Overwrite/)).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// UX-R3 wave 3 — in-progress indication (root-cause: WORKING was structurally 0)
//
// Real-parser E2E (NOT /api/runs interception): write genuine lock-less run dirs
// into the fixtures and let the actual liveness derivation classify them.
//   - A run whose newest journal event is FRESH (< the 1h active window) must
//     land in WORKING with the "live" in-progress chip — even with NO run.lock
//     (0 of 308 real runs have one; that was the root cause of an empty column).
//   - A run whose newest journal event is OLD (> the active window) must NOT be
//     in WORKING; it reads as Stalled (no live driver). Honest: only real recent
//     activity counts as in-progress, never merely "non-terminal".
// The E2E webServer pins OBSERVER_ACTIVE_THRESHOLD_MS=1h so the months-old static
// fixtures stay non-fresh; these two runs are the only movers.
// ---------------------------------------------------------------------------
test.describe("Kanban board — in-progress indication (UX-R3 wave 3)", () => {
  const FRESH_RUN_ID = "01KTESTWAVE3INPROGRESS01";
  const STALE_RUN_ID = "01KTESTWAVE3INPROGRESS02";
  const WAVE3_PROJECT = "wave3-inprogress"; // not a hidden project

  /** Write a minimal lock-less, non-terminal run dir whose newest journal event
   *  is `ageMs` old. One pending AGENT effect → waiting (never a breakpoint, so
   *  it is Working/Stalled, never Needs-you). No run.lock is written. */
  async function writeInProgressRun(runId: string, ageMs: number): Promise<void> {
    const dir = runDir(runId);
    const journalDir = path.join(dir, "journal");
    await fs.mkdir(journalDir, { recursive: true });
    const ts = new Date(Date.now() - ageMs).toISOString();
    await fs.writeFile(
      path.join(dir, "run.json"),
      JSON.stringify({ runId, processId: `${WAVE3_PROJECT}/driver`, projectName: WAVE3_PROJECT }, null, 2)
    );
    await fs.writeFile(
      path.join(journalDir, `000001.${runId}A.json`),
      JSON.stringify({
        type: "RUN_CREATED",
        recordedAt: ts,
        data: { runId, processId: `${WAVE3_PROJECT}/driver` },
      })
    );
    await fs.writeFile(
      path.join(journalDir, `000002.${runId}B.json`),
      JSON.stringify({
        type: "EFFECT_REQUESTED",
        recordedAt: ts,
        data: {
          effectId: `${runId}EFF`,
          kind: "agent",
          label: "working step",
          invocationKey: `${WAVE3_PROJECT}/driver:S1:step`,
          stepId: "S1",
          taskId: "step",
        },
      })
    );
  }

  test("a fresh lock-less run appears in WORKING with a live chip; a stale one does not", async ({ page }) => {
    try {
      await writeInProgressRun(FRESH_RUN_ID, 30_000); // 30s old → within 1h active window
      await writeInProgressRun(STALE_RUN_ID, 3 * 60 * 60 * 1000); // 3h old → past it

      await gotoBoard(page);

      // Fresh run is genuinely in progress → WORKING (not Orphaned/Stalled),
      // even though it has no run.lock.
      const freshCard = cardFor(page, FRESH_RUN_ID);
      await expect(freshCard).toBeVisible({ timeout: 20_000 });
      await expect(
        column(page, "waiting").locator(`[data-run-id="${FRESH_RUN_ID}"]`)
      ).toHaveCount(1);
      // ...and it carries the honest in-progress ("live") affordance.
      await expect(
        freshCard.getByText(/in progress, recent activity means this run is actively being worked/i)
      ).toBeAttached();

      // Stale run is NOT in Working; it reads as Stalled (no live driver).
      const staleCard = cardFor(page, STALE_RUN_ID);
      await expect(staleCard).toBeVisible({ timeout: 20_000 });
      await expect(
        column(page, "waiting").locator(`[data-run-id="${STALE_RUN_ID}"]`)
      ).toHaveCount(0);
      await expect(
        column(page, "stalled").locator(`[data-run-id="${STALE_RUN_ID}"]`)
      ).toHaveCount(1);
    } finally {
      await fs.rm(runDir(FRESH_RUN_ID), { recursive: true, force: true }).catch(() => {});
      await fs.rm(runDir(STALE_RUN_ID), { recursive: true, force: true }).catch(() => {});
    }
  });
});
