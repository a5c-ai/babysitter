/**
 * Shared helpers for the FROZEN v4 A5C Commander e2e suite.
 *
 * Authored strictly from SPEC.md + SPEC-V2.md + SPEC-V3.md + SPEC-V4.md (V4 supersedes on
 * conflict). These tests are frozen inputs; the implementation is built to satisfy them.
 *
 * Determinism contract (SPEC §9, SPEC-V3 §V3-7, SPEC-V4 §V4-4/§V4-13):
 *  - boot `/?seed=42`, pause sim on load, advance ONLY via `window.__commander.sim.tick(n)`;
 *  - `tick(n)` semantics are UNCHANGED by the v4 pacing slowdown (§V4-4) but lifecycle phase
 *    durations roughly double, so tickUntil budgets here are ~2x the v3 budgets (budgets are
 *    not semantic assertions);
 *  - all new v4 verbs (`revertCard`, `release`, `rollbackCard`, `updateTask`, `upsertStack`,
 *    `updateProcessTemplate`, `writeFile`, `speed`) are deterministic, journaled, and exposed
 *    on the test-hooks API per the established convention (§V4-13 "All new verbs are
 *    deterministic and journaled"; same probing pattern as `moveCard` in helpers-v3).
 *
 * Selector contract (SPEC-V4 testids): `kanban-col-merged`, `kanban-col-in-production`,
 * `col-release`, `topbar-speed`, `card-editor`, `foundry-stacks`, `topbar-runs`,
 * `runs-overlay`, `run-detail`, `process-library`, `process-editor`,
 * `inspector-tab-terminal`, `terminal-input`, `terminal-output`, `inspector-tab-memory`,
 * `memory-search`, `review-open-ide`, `ide-overlay`, `ide-explorer`, `ide-tab-*`, `ide-ghost`.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { commandCell, tick, tickUntil } from './helpers';
import {
  cardById,
  column,
  columnOfCard,
  moveCardViaSim,
  SEL3,
  singleCardsIn,
  yoloToggle,
  type ColumnId,
  type SingleCardInfo,
} from './helpers-v3';

/** SPEC-V4 §V4-1: the full seven-lane release rail. */
export const COLUMNS_V4 = [
  'backlog',
  'do',
  'ai-review',
  'human-review',
  'approved',
  'merged',
  'in-production',
] as const;

/** SPEC-V4 data-testid contract. */
export const SEL4 = {
  colRelease: '[data-testid="col-release"]',
  topbarSpeed: '[data-testid="topbar-speed"]',
  cardEditor: '[data-testid="card-editor"]',
  foundryStacks: '[data-testid="foundry-stacks"]',
  topbarRuns: '[data-testid="topbar-runs"]',
  runsOverlay: '[data-testid="runs-overlay"]',
  runDetail: '[data-testid="run-detail"]',
  processLibrary: '[data-testid="process-library"]',
  processEditor: '[data-testid="process-editor"]',
  inspectorTabTerminal: '[data-testid="inspector-tab-terminal"]',
  terminalInput: '[data-testid="terminal-input"]',
  terminalOutput: '[data-testid="terminal-output"]',
  inspectorTabMemory: '[data-testid="inspector-tab-memory"]',
  memorySearch: '[data-testid="memory-search"]',
  reviewOpenIde: '[data-testid="review-open-ide"]',
  ideOverlay: '[data-testid="ide-overlay"]',
  ideExplorer: '[data-testid="ide-explorer"]',
  ideTab: '[data-testid^="ide-tab-"]',
  ideGhost: '[data-testid="ide-ghost"]',
} as const;

/* ------------------------------------------------------------------------------------------
 * Sim verbs & sim scalars (SPEC-V4 §V4-1/§V4-4/§V4-5/§V4-6/§V4-8/§V4-11/§V4-13)
 * ---------------------------------------------------------------------------------------- */

/**
 * Invoke a deterministic v4 sim verb on the test-hooks API (same probing convention as
 * `moveCard` in helpers-v3: `sim.<verb>`, `sim.verbs.<verb>`, or `__commander.<verb>`).
 * Returns whatever the verb returns (e.g. `getWorkspaceTree`, `getFileContent`, §V4-8).
 */
export async function callSimVerb<T = unknown>(
  page: Page,
  verb: string,
  args: unknown[] = [],
): Promise<T> {
  return page.evaluate(
    ([verbName, verbArgs]) => {
      const w = window as unknown as {
        __commander: Record<string, unknown> & { sim: Record<string, unknown> };
      };
      const sim = w.__commander.sim;
      const verbs = (sim['verbs'] ?? {}) as Record<string, unknown>;
      const candidate =
        (typeof sim[verbName] === 'function' && sim[verbName]) ||
        (typeof verbs[verbName] === 'function' && verbs[verbName]) ||
        (typeof w.__commander[verbName] === 'function' && w.__commander[verbName]);
      if (!candidate) {
        throw new Error(
          `sim verb "${verbName}" not found on window.__commander.sim (SPEC-V4 §V4-13: ` +
            'all new verbs are deterministic and journaled and exposed on the test-hooks API ' +
            'per the established moveCard convention).',
        );
      }
      return (candidate as (...a: unknown[]) => unknown).apply(sim, verbArgs as unknown[]) as never;
    },
    [verb, args] as const,
  );
}

/** Read `sim.tickIntervalMs` and `sim.speed` (SPEC-V4 §V4-4: exposed on the test-hooks API). */
export async function getSimPacing(page: Page): Promise<{ tickIntervalMs: number; speed: number }> {
  return page.evaluate(() => {
    const w = window as unknown as { __commander: { sim: Record<string, unknown> } };
    const sim = w.__commander.sim;
    return {
      tickIntervalMs: Number(sim['tickIntervalMs']),
      speed: Number(sim['speed']),
    };
  });
}

/* ------------------------------------------------------------------------------------------
 * Selection, commands, inspector
 * ---------------------------------------------------------------------------------------- */

/** Click a card to select it (SelectionPanel + contextual CommandCard, §V3-1). */
export async function selectCard(page: Page, taskId: string): Promise<void> {
  await cardById(page, taskId).click();
  await expect(
    page.locator(SEL3.selectionPanel),
    `selecting card-${taskId} must open the SelectionPanel (§V3-1)`,
  ).toBeVisible();
}

/** Select a card, then click the contextual command whose label matches. */
export async function invokeCardCommand(page: Page, taskId: string, label: RegExp): Promise<void> {
  await selectCard(page, taskId);
  const cell = commandCell(page, label);
  await expect(
    cell,
    `contextual command ${String(label)} must be offered for the selected card-${taskId} (SPEC-V4 command staples)`,
  ).toBeVisible();
  await cell.click();
}

/** Double-click a card to open (or retarget, §V4-3) the Inspector. */
export async function openInspectorFor(page: Page, taskId: string): Promise<Locator> {
  await cardById(page, taskId).dblclick();
  const inspector = page.locator(SEL3.inspector);
  await expect(inspector, `double-clicking card-${taskId} must open the Inspector (§V3-1)`).toBeVisible();
  return inspector;
}

/** Tolerant "is this tab the active one" probe (aria-selected / data-state / class). */
export async function isTabActive(tab: Locator): Promise<boolean> {
  return tab.evaluate((el: Element) => {
    if (el.getAttribute('aria-selected') === 'true') return true;
    if ((el.getAttribute('data-state') ?? '').toLowerCase() === 'active') return true;
    return /\b(active|selected|current)\b/i.test(el.getAttribute('class') ?? '');
  });
}

/* ------------------------------------------------------------------------------------------
 * Release-rail lifecycle driving (SPEC-V4 §V4-1)
 * ---------------------------------------------------------------------------------------- */

/** v4 default budgets: lifecycle pacing is ~2x slower than v3 (§V4-4) — budget generously. */
export const V4_BUDGET = { chunk: 10, maxChunks: 160 } as const; // 1600 ticks
export const V4_BUDGET_LONG = { chunk: 10, maxChunks: 320 } as const; // 3200 ticks (full rail)

/**
 * Flag every single backlog card yolo and start them all, then tick until at least `want` of
 * them sit in MERGED (yolo: pass AI review → approved → integration auto-moves to merged,
 * §V4-1). Returns the taskIds currently in MERGED.
 */
export async function driveCardsToMerged(page: Page, want: number): Promise<string[]> {
  const singles = await singleCardsIn(page, 'backlog');
  expect(
    singles.length,
    'boot backlog must contain several single cards to drive down the release rail (§V3-2)',
  ).toBeGreaterThanOrEqual(want);
  for (const c of singles) {
    await yoloToggle(page, c.taskId).click();
    await moveCardViaSim(page, c.taskId, 'do');
  }
  const ids = singles.map((c) => c.taskId);
  let merged: string[] = [];
  const ok = await tickUntil(
    page,
    async () => {
      merged = [];
      for (const id of ids) {
        if ((await columnOfCard(page, id)) === 'merged') merged.push(id);
      }
      return merged.length >= want;
    },
    V4_BUDGET_LONG,
  );
  if (!ok) {
    const where: Record<string, string | null> = {};
    for (const id of ids) where[id] = await columnOfCard(page, id);
    throw new Error(
      `fewer than ${want} yolo cards reached MERGED within ${V4_BUDGET_LONG.chunk * V4_BUDGET_LONG.maxChunks} ` +
        `ticks (SPEC-V4 §V4-1: integration completion AUTO-moves approved cards to merged); ` +
        `columns now: ${JSON.stringify(where)}`,
    );
  }
  return merged;
}

/** Does the card visually carry the merged seal (class / data-state / descendant testid)? */
export async function hasMergedSeal(page: Page, taskId: string): Promise<boolean> {
  return cardById(page, taskId).evaluate((el: Element) => {
    if (/\bmerged\b/i.test(el.getAttribute('class') ?? '')) return true;
    if ((el.getAttribute('data-state') ?? '').toLowerCase() === 'merged') return true;
    if (el.querySelector('[data-testid*="merged"], [class*="merged"]')) return true;
    return false;
  });
}

/** Bounded tick-wait for a card to land in a v4 lane, with a v4-pacing-sized budget. */
export async function tickUntilCardInColumnV4(
  page: Page,
  taskId: string,
  columnId: (typeof COLUMNS_V4)[number],
  opts: { chunk?: number; maxChunks?: number } = {},
): Promise<void> {
  const { chunk = V4_BUDGET.chunk, maxChunks = V4_BUDGET.maxChunks } = opts;
  const ok = await tickUntil(
    page,
    async () => (await columnOfCard(page, taskId)) === (columnId as ColumnId),
    { chunk, maxChunks },
  );
  if (!ok) {
    const where = await columnOfCard(page, taskId);
    throw new Error(
      `card-${taskId} never reached column "${columnId}" within ${chunk * maxChunks} ticks ` +
        `(still in "${String(where)}").`,
    );
  }
}

/* ------------------------------------------------------------------------------------------
 * Pointer drag — first half only (SPEC-V4 §V4-2 / AC36)
 * ---------------------------------------------------------------------------------------- */

export interface MidDrag {
  /** Current pointer position; the drag ghost tracks it (§V4-2). Button is still DOWN. */
  x: number;
  y: number;
}

/**
 * Begin a real pointer drag of `card-<taskId>` toward `columnId` and STOP mid-flight without
 * dropping (mirrors the first half of helpers-v3 `dragCard`). Caller must finish with
 * `page.mouse.up()` (complete) or Escape + up (cancel).
 */
export async function beginCardDrag(
  page: Page,
  taskId: string,
  columnId: ColumnId,
): Promise<MidDrag> {
  const card = cardById(page, taskId);
  const lane = column(page, columnId);
  const from = await card.boundingBox();
  const to = await lane.boundingBox();
  if (!from) throw new Error(`beginCardDrag: card-${taskId} has no bounding box (not rendered?)`);
  if (!to) throw new Error(`beginCardDrag: kanban-col-${columnId} has no bounding box`);
  const start = { x: from.x + from.width / 2, y: from.y + Math.min(20, from.height / 2) };
  const end = { x: to.x + to.width / 2, y: to.y + Math.min(to.height / 2, 120) };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  // Intermediate moves so pointermove-driven drag logic engages — stop at 60% of the way.
  let cur = start;
  for (const f of [0.15, 0.35, 0.6]) {
    cur = { x: start.x + (end.x - start.x) * f, y: start.y + (end.y - start.y) * f };
    await page.mouse.move(cur.x, cur.y, { steps: 4 });
  }
  return cur;
}

export interface HitInfo {
  /** data-testid of the element directly under the point (may be ''). */
  selfTestid: string;
  /** testid of the closest `card-*` ancestor (or '') — the dragged card / its ghost clone. */
  cardAncestor: string;
  /** true when the hit chain includes a dedicated drag-ghost layer element (§V4-2 portal). */
  inGhostLayer: boolean;
  /** true when the TOPMOST hit element itself is a lane / lane chrome (occlusion — AC36 fail). */
  laneIsTopmost: boolean;
  /** class attribute of the hit element, for diagnostics. */
  classes: string;
}

/** `document.elementFromPoint` probe for AC36 (§V4-2 stacking-order fix). */
export async function elementAtPoint(page: Page, x: number, y: number): Promise<HitInfo> {
  return page.evaluate(
    ([px, py]) => {
      const hit = document.elementFromPoint(px, py);
      if (!hit) {
        return { selfTestid: '', cardAncestor: '', inGhostLayer: false, laneIsTopmost: false, classes: '' };
      }
      const isCardTestid = (t: string) =>
        t.startsWith('card-') && !t.startsWith('card-agent-') && !t.startsWith('card-yolo-');
      const cardEl = hit.closest('[data-testid^="card-"]');
      const cardTestid = cardEl?.getAttribute('data-testid') ?? '';
      const ghost = hit.closest(
        '[data-drag-ghost], [data-testid*="drag-ghost"], [data-testid*="ghost"], [class*="drag-ghost"], [class*="ghost"]',
      );
      const laneSelf = (hit.getAttribute('data-testid') ?? '').startsWith('kanban-col-');
      return {
        selfTestid: hit.getAttribute('data-testid') ?? '',
        cardAncestor: isCardTestid(cardTestid) ? cardTestid : '',
        inGhostLayer: ghost !== null,
        laneIsTopmost: laneSelf && cardEl === null && ghost === null,
        classes: hit.getAttribute('class') ?? '',
      };
    },
    [x, y] as const,
  );
}

/* ------------------------------------------------------------------------------------------
 * Card editor + agent stacks (SPEC-V4 §V4-5)
 * ---------------------------------------------------------------------------------------- */

/** Open the card editor for a card via the `Edit Card` contextual command (§V4-5). */
export async function openCardEditor(page: Page, taskId: string): Promise<Locator> {
  await invokeCardCommand(page, taskId, /edit card/i);
  const editor = page.locator(SEL4.cardEditor);
  await expect(
    editor,
    'the Edit Card command must open the parchment card-editor dialog (SPEC-V4 §V4-5)',
  ).toBeVisible();
  return editor;
}

/**
 * Forge a custom agent stack via the deterministic sim verb `upsertStack(stack)` (§V4-5,
 * kradle AgentStack mirror). Returns the distinctive stack name used.
 */
export async function forgeStackViaSim(page: Page, name: string): Promise<string> {
  await callSimVerb(page, 'upsertStack', [
    {
      metadata: { name },
      spec: {
        baseAgent: 'claude-code',
        adapter: 'claude-code',
        model: 'claude-fable-5',
        prompt: {
          system: 'A meticulous, spec-citing auditor who trusts nothing it has not measured.',
          developer: 'Cite the relevant spec line for every change you propose.',
        },
        approvalMode: 'manual',
      },
      status: { phase: 'ready' },
    },
  ]);
  await tick(page, 1);
  return name;
}

/**
 * Find the agent-stack <select> inside the card editor: §V4-5 says new stacks "appear in the
 * card editor's stack select", so we identify it as the select offering `customStackName`.
 */
export function stackSelectIn(editor: Locator, customStackName: string): Locator {
  return editor
    .locator('select')
    .filter({ has: editor.page().locator(`option:text-matches("${customStackName}", "i")`) })
    .first();
}

/* ------------------------------------------------------------------------------------------
 * Terminal (SPEC-V4 §V4-7)
 * ---------------------------------------------------------------------------------------- */

/** Resolve the actual typeable element for `terminal-input` (the element or an inner input). */
async function terminalInputField(page: Page): Promise<Locator> {
  const el = page.locator(SEL4.terminalInput).first();
  const tag = await el.evaluate((e: Element) => e.tagName.toLowerCase());
  if (tag === 'input' || tag === 'textarea') return el;
  return el.locator('input, textarea').first();
}

/** Type a command into the cogitator terminal, press Enter, and return the full output text. */
export async function terminalRun(page: Page, command: string): Promise<string> {
  const field = await terminalInputField(page);
  await field.click();
  await field.fill(command);
  await field.press('Enter');
  const out = page.locator(SEL4.terminalOutput).first();
  await expect(out, 'terminal-output region must exist (SPEC-V4 §V4-7)').toBeVisible();
  return (await out.innerText()).toLowerCase();
}

/* ------------------------------------------------------------------------------------------
 * Archive graph geometry probes (SPEC-V4 §V4-10 / AC44)
 * ---------------------------------------------------------------------------------------- */

/** Centers of the first two memory nodes — their distance is a zoom-scale proxy (view-only). */
export async function nodePairDistance(page: Page): Promise<number> {
  return page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('[data-testid^="memory-node-"]')).slice(0, 2);
    if (nodes.length < 2) return -1;
    const c = (el: Element) => {
      const b = el.getBoundingClientRect();
      return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    };
    const a = c(nodes[0]);
    const b = c(nodes[1]);
    return Math.hypot(a.x - b.x, a.y - b.y);
  });
}

/** Center of the first memory node — a pan proxy. */
export async function firstNodeCenter(page: Page): Promise<{ x: number; y: number }> {
  const out = await page.evaluate(() => {
    const node = document.querySelector('[data-testid^="memory-node-"]');
    if (!node) return null;
    const b = node.getBoundingClientRect();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  });
  if (!out) throw new Error('no memory-node-* element found in the Archive overlay (V2 AC17)');
  return out;
}

/** A point inside the archive graph canvas not covered by any node (for wheel/pan gestures). */
export async function emptyCanvasPoint(page: Page): Promise<{ x: number; y: number }> {
  const out = await page.evaluate(() => {
    const overlay = document.querySelector('[data-testid="memory-overlay"]');
    const anyNode = overlay?.querySelector('[data-testid^="memory-node-"]');
    const canvas = anyNode?.closest('svg') ?? overlay?.querySelector('svg');
    if (!canvas) return null;
    const cb = canvas.getBoundingClientRect();
    const boxes = Array.from(
      (overlay ?? document).querySelectorAll('[data-testid^="memory-node-"]'),
    ).map((n) => n.getBoundingClientRect());
    const margin = 24;
    for (let fy = 0.2; fy < 0.85; fy += 0.1) {
      for (let fx = 0.2; fx < 0.85; fx += 0.1) {
        const x = cb.x + cb.width * fx;
        const y = cb.y + cb.height * fy;
        const onNode = boxes.some(
          (b) => x >= b.x - margin && x <= b.x + b.width + margin && y >= b.y - margin && y <= b.y + b.height + margin,
        );
        if (!onNode) return { x, y };
      }
    }
    return { x: cb.x + cb.width / 2, y: cb.y + cb.height * 0.9 };
  });
  if (!out) throw new Error('no graph canvas (svg with memory nodes) found in the Archive overlay');
  return out;
}

/* ------------------------------------------------------------------------------------------
 * Misc
 * ---------------------------------------------------------------------------------------- */

/** Find a single backlog card (with a readable kind) or fail with a spec citation. */
export async function pickBacklogSingle(page: Page): Promise<SingleCardInfo> {
  const singles = await singleCardsIn(page, 'backlog');
  const target = singles.find((c) => c.kind !== null) ?? singles[0];
  expect(
    target,
    'boot backlog must contain at least one single card (SPEC-V3 §V3-2 boot scenario)',
  ).toBeTruthy();
  return target;
}
