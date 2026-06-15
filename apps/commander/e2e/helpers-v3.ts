/**
 * Shared helpers for the FROZEN v2/v3 A5C Commander e2e suite.
 *
 * Authored strictly from SPEC.md + SPEC-V2.md + SPEC-V3.md (V3 supersedes where it
 * conflicts — the RTS map canvas is replaced by the kanban board, SPEC-V3 §V3-1).
 * These tests are frozen inputs; the implementation is built to satisfy them.
 *
 * Determinism contract (SPEC §9, SPEC-V3 §V3-7):
 *  - boot `/?seed=42`, pause sim on load, advance ONLY via `window.__commander.sim.tick(n)`;
 *  - all board movement flows through deterministic sim verbs (user drags included);
 *  - expect-polling only; bounded tickUntil with clear failure messages.
 *
 * Selector contract: SPEC-V3 §V3-1/§V3-4/§V3-5 testids (`kanban-board`, `kanban-col-<id>`,
 * `card-<taskId>`, `card-yolo-<taskId>`, `card-agent-<unitId>`, `review-panel`,
 * `ws-file-<index>`, `review-approve-all`, `chat-dock`, `inquiry-<hookRequestId>`,
 * `inquiry-opt-<hookRequestId>-<optionId>`) plus SPEC-V2 ids (`memory-*`, `foundry`,
 * `inspector-tab-*`, `topbar-memory`, `topbar-create`, `sel-stage`, `ws-approve`, `ws-reject`).
 * Where an id value is unknowable from the specs we select by prefix.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { tick, tickUntil } from './helpers';

/**
 * Column ids — SPEC-V3 §V3-1 as AMENDED by SPEC-V4 §V4-1 (sanctioned in the SPEC-V4 header:
 * "AC25's five-column assertion becomes seven columns"): the board gains the release rail
 * lanes `merged` and `in-production` (testids `kanban-col-merged`, `kanban-col-in-production`).
 */
export const COLUMNS = [
  'backlog',
  'do',
  'ai-review',
  'human-review',
  'approved',
  'merged',
  'in-production',
] as const;
export type ColumnId = (typeof COLUMNS)[number];

/** SPEC-V2 §V2-2 task kinds (sim must generate all). */
export const TASK_KINDS = [
  'root-cause-analysis',
  'test-coverage',
  'implement',
  'review',
  'fix',
  'polish',
  'docs',
  'deploy',
  'research',
  'migrate',
] as const;
export type TaskKind = (typeof TASK_KINDS)[number];

/** SPEC-V3 §V3-2 task-kind → worker adapter mapping. */
export const ADAPTER_BY_KIND: Record<TaskKind, string> = {
  implement: 'claude-code',
  fix: 'claude-code',
  migrate: 'claude-code',
  review: 'codex',
  'root-cause-analysis': 'pi',
  'test-coverage': 'pi',
  docs: 'gemini-cli',
  research: 'gemini-cli',
  polish: 'codex',
  deploy: 'codex',
};

export const ADAPTERS = ['claude-code', 'codex', 'gemini-cli', 'pi'] as const;

/** SPEC-V3 / SPEC-V2 data-testid contract. */
export const SEL3 = {
  board: '[data-testid="kanban-board"]',
  card: '[data-testid^="card-"]:not([data-testid^="card-agent-"]):not([data-testid^="card-yolo-"])',
  cardAgent: '[data-testid^="card-agent-"]',
  reviewPanel: '[data-testid="review-panel"]',
  reviewApproveAll: '[data-testid="review-approve-all"]',
  chatDock: '[data-testid="chat-dock"]',
  inquiry: '[data-testid^="inquiry-"]:not([data-testid^="inquiry-opt-"])',
  inquiryOpt: '[data-testid^="inquiry-opt-"]',
  tickerItem: '[data-testid="ticker-item"]',
  selectionPanel: '[data-testid="selection-panel"]',
  inspector: '[data-testid="inspector"]',
  inspectorTabTranscript: '[data-testid="inspector-tab-transcript"]',
  inspectorTabProcess: '[data-testid="inspector-tab-process"]',
  inspectorTabWorkspace: '[data-testid="inspector-tab-workspace"]',
  foundry: '[data-testid="foundry"]',
  memoryOverlay: '[data-testid="memory-overlay"]',
  memorySilo: '[data-testid^="memory-silo-"]',
  memoryNode: '[data-testid^="memory-node-"]',
  cmd: '[data-testid^="cmd-"]',
  wsFile: '[data-testid^="ws-file-"]',
} as const;

export function column(page: Page, id: ColumnId): Locator {
  return page.locator(`[data-testid="kanban-col-${id}"]`);
}

export function cardById(page: Page, taskId: string): Locator {
  return page.locator(`[data-testid="card-${taskId}"]`).first();
}

export function yoloToggle(page: Page, taskId: string): Locator {
  return page.locator(`[data-testid="card-yolo-${taskId}"]`).first();
}

/** Cards rendered inside a column (includes stack mini-children, which are cards too). */
export function cardsInColumn(page: Page, id: ColumnId): Locator {
  return column(page, id).locator(SEL3.card);
}

export interface BootBoardOptions {
  seed?: number;
}

/**
 * Boot the Cogitator Board deterministically: `/?seed=<seed>`, pause the sim the instant the
 * SPEC §9 test-hooks API appears, and wait for the board + backlog cards (SPEC-V3 §V3-1/§V3-2:
 * boot scenario places 2 stacks + several singles in backlog; zero agents).
 */
export async function bootBoard(page: Page, opts: BootBoardOptions = {}): Promise<void> {
  const { seed = 42 } = opts;
  await page.addInitScript(() => {
    const iv = setInterval(() => {
      const w = window as unknown as { __commander?: { sim?: { pause?: () => void } } };
      if (w.__commander?.sim?.pause) {
        try {
          w.__commander.sim.pause();
        } catch {
          /* ignore */
        }
        clearInterval(iv);
      }
    }, 5);
    setTimeout(() => clearInterval(iv), 30_000);
  });
  await page.goto(`/?seed=${seed}`);
  await page.waitForFunction(
    () => Boolean((window as unknown as { __commander?: unknown }).__commander),
  );
  await expect(page.locator(SEL3.board)).toBeVisible();
  await expect(cardsInColumn(page, 'backlog').first()).toBeVisible();
}

/** Resolve which column currently contains `card-<taskId>` (or null when absent). */
export async function columnOfCard(page: Page, taskId: string): Promise<ColumnId | null> {
  return page.evaluate((id: string) => {
    const card = document.querySelector(`[data-testid="card-${id}"]`);
    const col = card?.closest('[data-testid^="kanban-col-"]');
    const testid = col?.getAttribute('data-testid') ?? '';
    return testid ? (testid.slice('kanban-col-'.length) as never) : null;
  }, taskId);
}

/**
 * SPEC-V3 §V3-1 drag & drop: pointer-based (pointerdown/move/up) with intermediate moves —
 * lift the card and drop it onto the target lane.
 */
export async function dragCard(page: Page, taskId: string, columnId: ColumnId): Promise<void> {
  const card = cardById(page, taskId);
  const lane = column(page, columnId);
  const from = await card.boundingBox();
  const to = await lane.boundingBox();
  if (!from) throw new Error(`dragCard: card-${taskId} has no bounding box (not rendered?)`);
  if (!to) throw new Error(`dragCard: kanban-col-${columnId} has no bounding box`);
  const start = { x: from.x + from.width / 2, y: from.y + Math.min(20, from.height / 2) };
  // Aim at the upper area of the lane (below its header) to avoid landing on other cards' midpoints.
  const end = { x: to.x + to.width / 2, y: to.y + Math.min(to.height / 2, 120) };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  // Intermediate moves so pointermove-driven drag logic engages (no HTML5 DnD).
  for (const f of [0.15, 0.35, 0.55, 0.75, 0.9, 1]) {
    await page.mouse.move(start.x + (end.x - start.x) * f, start.y + (end.y - start.y) * f, {
      steps: 4,
    });
  }
  await page.mouse.up();
}

/**
 * SPEC-V3 §V3-1/§V3-7 sim verb `moveCard(taskId, column)` — verb-driven setup for downstream
 * ACs (the real pointer drag is proven by AC26). Probes the test-hooks API for the verb.
 */
export async function moveCardViaSim(page: Page, taskId: string, columnId: ColumnId): Promise<void> {
  await page.evaluate(
    ([id, col]) => {
      const w = window as unknown as {
        __commander: Record<string, unknown> & {
          sim: Record<string, unknown> & { tick(n: number): void };
        };
      };
      const sim = w.__commander.sim;
      const verbs = (sim['verbs'] ?? {}) as Record<string, unknown>;
      const candidate =
        (typeof sim['moveCard'] === 'function' && sim['moveCard']) ||
        (typeof verbs['moveCard'] === 'function' && verbs['moveCard']) ||
        (typeof w.__commander['moveCard'] === 'function' && w.__commander['moveCard']);
      if (!candidate) {
        throw new Error(
          'moveCard sim verb not found on window.__commander.sim (SPEC-V3 §V3-1: "Each user drag ' +
            'issues a sim verb (moveCard(taskId, column))"; §V3-7: all board movement flows through ' +
            'deterministic sim verbs — expose it on the test hooks API).',
        );
      }
      (candidate as (taskId: string, column: string) => void).call(sim, id, col);
    },
    [taskId, columnId] as const,
  );
  // Let the move materialize on the next batched store commit.
  await tick(page, 1);
}

/**
 * Bounded, tick-driven wait for `card-<taskId>` to land in `columnId`.
 * Generous default budget: 160 chunks × 10 ticks = 1600 ticks (doubled per SPEC-V4 §V4-4
 * pacing slowdown — sanctioned by the SPEC-V4 header; budgets are not semantic).
 */
export async function tickUntilCardInColumn(
  page: Page,
  taskId: string,
  columnId: ColumnId,
  opts: { chunk?: number; maxChunks?: number } = {},
): Promise<void> {
  const { chunk = 10, maxChunks = 160 } = opts;
  const ok = await tickUntil(page, async () => (await columnOfCard(page, taskId)) === columnId, {
    chunk,
    maxChunks,
  });
  if (!ok) {
    const where = await columnOfCard(page, taskId);
    throw new Error(
      `card-${taskId} never reached column "${columnId}" within ${chunk * maxChunks} ticks ` +
        `(still in "${String(where)}").`,
    );
  }
}

/** Agent avatars currently attached to a card (SPEC-V3 §V3-1 agent slot, `card-agent-<unitId>`). */
export function agentsOnCard(page: Page, taskId: string): Locator {
  return cardById(page, taskId).locator(SEL3.cardAgent);
}

/**
 * Adapter of an agent avatar — SPEC-V3 AC26: "assert via data-adapter attr or class".
 */
export async function agentAdapter(avatar: Locator): Promise<string | null> {
  return avatar.evaluate((el: Element, adapters: readonly string[]) => {
    const attr = el.getAttribute('data-adapter');
    if (attr) return attr;
    const cls = el.getAttribute('class') ?? '';
    for (const a of adapters) if (cls.includes(a)) return a;
    return null;
  }, ADAPTERS);
}

/**
 * Detect the task kind of a card from its kind chip text (SPEC-V3 §V3-1: cards carry a kind
 * chip; the chip's exact testid is unknowable, so match the card text — longest kinds first).
 */
export async function kindOfCard(page: Page, taskId: string): Promise<TaskKind | null> {
  const text = ((await cardById(page, taskId).innerText()) ?? '').toLowerCase();
  for (const kind of TASK_KINDS) {
    if (new RegExp(`\\b${kind.replace(/-/g, '[-\\s]')}\\b`).test(text)) return kind;
  }
  return null;
}

export interface SingleCardInfo {
  taskId: string;
  kind: TaskKind | null;
  title: string;
}

/**
 * Enumerate "single" cards in a column — cards that are neither a stack parent (contain
 * descendant cards) nor a stack mini-child (nested inside another card). SPEC-V3 §V3-1:
 * subtask stacks render parent card with attached mini-cards.
 */
export async function singleCardsIn(page: Page, colId: ColumnId): Promise<SingleCardInfo[]> {
  const ids = await page.evaluate((col: string) => {
    const lane = document.querySelector(`[data-testid="kanban-col-${col}"]`);
    if (!lane) return [] as string[];
    const isCard = (el: Element) => {
      const t = el.getAttribute('data-testid') ?? '';
      return t.startsWith('card-') && !t.startsWith('card-agent-') && !t.startsWith('card-yolo-');
    };
    const cards = Array.from(lane.querySelectorAll('[data-testid^="card-"]')).filter(isCard);
    const out: string[] = [];
    for (const card of cards) {
      const parentCard = card.parentElement?.closest('[data-testid^="card-"]');
      const hasChildCards = Array.from(card.querySelectorAll('[data-testid^="card-"]')).some(isCard);
      if (!parentCard && !hasChildCards) out.push((card.getAttribute('data-testid') ?? '').slice(5));
    }
    return out;
  }, colId);
  const infos: SingleCardInfo[] = [];
  for (const taskId of ids) {
    const title = ((await cardById(page, taskId).innerText()) ?? '').trim();
    infos.push({ taskId, kind: await kindOfCard(page, taskId), title });
  }
  return infos;
}

/** All ticker item texts, oldest-to-newest as rendered. */
export async function tickerTexts(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-testid="ticker-item"]')).map((el) =>
      (el.textContent ?? '').trim(),
    ),
  );
}

/** Tick (bounded) until some ticker item matches `pattern`. Returns the matching text. */
export async function tickUntilTickerMatches(
  page: Page,
  pattern: RegExp,
  opts: { chunk?: number; maxChunks?: number; label?: string } = {},
): Promise<string> {
  // default budget doubled for the SPEC-V4 §V4-4 pacing slowdown (sanctioned; non-semantic)
  const { chunk = 10, maxChunks = 160, label = String(pattern) } = opts;
  let match = '';
  const ok = await tickUntil(
    page,
    async () => {
      const texts = await tickerTexts(page);
      match = texts.find((t) => pattern.test(t)) ?? '';
      return match !== '';
    },
    { chunk, maxChunks },
  );
  if (!ok) {
    throw new Error(
      `No ticker entry matching ${label} appeared within ${chunk * maxChunks} ticks.`,
    );
  }
  return match;
}

/**
 * Install a MutationObserver that records (on `window.__movedCards`) every card testid that
 * EVER carries the `is-moving` class (SPEC-V3 §V3-3: "While animating, the card carries an
 * is-moving class (e2e hook)"). Catches the transient class between tick chunks.
 */
export async function watchIsMoving(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { __movedCards?: Set<string>; __movingObserver?: MutationObserver };
    if (w.__movingObserver) return;
    w.__movedCards = new Set<string>();
    const record = (el: Element) => {
      const card = el.closest('[data-testid^="card-"]') ?? el;
      const id = card.getAttribute('data-testid');
      if (id && el.classList.contains('is-moving')) w.__movedCards?.add(id);
    };
    const scan = () => {
      document.querySelectorAll('.is-moving').forEach(record);
    };
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.target instanceof Element) record(m.target);
        if (m.type === 'childList') scan();
      }
    });
    obs.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
    });
    w.__movingObserver = obs;
    scan();
  });
}

/** Card testids recorded by `watchIsMoving`. */
export async function movedCardIds(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const w = window as unknown as { __movedCards?: Set<string> };
    return [...(w.__movedCards ?? [])];
  });
}

export interface InquiryInfo {
  hookRequestId: string;
  optionIds: string[];
  optionCaptions: string[];
  questionText: string;
}

/** Inspect the first inquiry bubble in the chat dock with ≥ `minOptions` option buttons. */
export async function firstInquiryWithOptions(
  page: Page,
  minOptions: number,
): Promise<InquiryInfo | null> {
  return page.evaluate((min: number) => {
    const dock = document.querySelector('[data-testid="chat-dock"]');
    if (!dock) return null;
    const bubbles = Array.from(dock.querySelectorAll('[data-testid^="inquiry-"]')).filter((el) => {
      const t = el.getAttribute('data-testid') ?? '';
      return !t.startsWith('inquiry-opt-');
    });
    for (const bubble of bubbles) {
      const hookRequestId = (bubble.getAttribute('data-testid') ?? '').slice('inquiry-'.length);
      const opts = Array.from(bubble.querySelectorAll('[data-testid^="inquiry-opt-"]'));
      if (opts.length >= min) {
        const prefix = `inquiry-opt-${hookRequestId}-`;
        return {
          hookRequestId,
          optionIds: opts.map((o) => (o.getAttribute('data-testid') ?? '').slice(prefix.length)),
          optionCaptions: opts.map((o) => (o.textContent ?? '').trim()),
          questionText: (bubble.textContent ?? '').trim(),
        };
      }
    }
    return null;
  }, minOptions);
}

/**
 * Tick until an inquiry with ≥ `minOptions` options appears in the chat dock, then click the
 * option at `pick` and return what was chosen (SPEC-V3 §V3-5 / AC32).
 */
export async function openInquiryAndChoose(
  page: Page,
  opts: { minOptions?: number; pick?: number; chunk?: number; maxChunks?: number } = {},
): Promise<{ hookRequestId: string; optionId: string; caption: string }> {
  // default budget doubled for the SPEC-V4 §V4-4 pacing slowdown (sanctioned; non-semantic)
  const { minOptions = 3, pick = 0, chunk = 10, maxChunks = 160 } = opts;
  let info: InquiryInfo | null = null;
  const ok = await tickUntil(
    page,
    async () => {
      info = await firstInquiryWithOptions(page, minOptions);
      return info !== null;
    },
    { chunk, maxChunks },
  );
  if (!ok || !info) {
    throw new Error(
      `No inquiry with ≥${minOptions} options appeared in the chat dock within ` +
        `${chunk * maxChunks} ticks (SPEC-V3 §V3-5: sim emits multi-option inquiries).`,
    );
  }
  const found: InquiryInfo = info;
  const optionId = found.optionIds[Math.min(pick, found.optionIds.length - 1)];
  const caption = found.optionCaptions[Math.min(pick, found.optionCaptions.length - 1)];
  await page
    .locator(`[data-testid="inquiry-opt-${found.hookRequestId}-${optionId}"]`)
    .first()
    .click();
  return { hookRequestId: found.hookRequestId, optionId, caption };
}

/**
 * SPEC-V2 §V2-7 / SPEC-V3 §V3-4 diff plates: detect that a scope contains BOTH an addition row
 * and a deletion row. Exact row markup is unknowable from the specs, so accept either
 * class-based (`add`/`del`-ish class names) or text-marker (`+`/`-` prefixed) rows.
 */
export async function diffHasAdditionAndDeletion(scope: Locator): Promise<boolean> {
  return scope.evaluate((root: Element) => {
    const els = Array.from(root.querySelectorAll('*'));
    const byClass = (re: RegExp) =>
      els.some((el) => re.test(el.getAttribute('class') ?? '') && (el.textContent ?? '').trim() !== '');
    const byMarker = (marker: string) =>
      els.some((el) => {
        if (el.children.length > 4) return false;
        const t = (el.textContent ?? '').trim();
        return t.startsWith(marker) && t.length > 1;
      });
    const hasAdd = byClass(/\badd(ition|ed)?\b|diff-add/i) || byMarker('+');
    const hasDel = byClass(/\b(del(etion|eted)?|remov)/i) || byMarker('-');
    return hasAdd && hasDel;
  });
}

/**
 * AC33 / SPEC-V3 retirement note: with the LinkLayer gone, the census rule is
 * "zero `<line>`/`<polyline>` elements document-wide, always".
 */
export async function countLinePolyline(page: Page): Promise<number> {
  return page.evaluate(() => document.querySelectorAll('line, polyline').length);
}

/** Capture `card-<id>` → first inline `<svg>` outerHTML (wax-seal kind icon, AC33 byte-identity). */
export async function captureCardIcons(page: Page, limit = 8): Promise<Record<string, string>> {
  return page.evaluate((max: number) => {
    const out: Record<string, string> = {};
    const cards = Array.from(document.querySelectorAll('[data-testid^="card-"]')).filter((el) => {
      const t = el.getAttribute('data-testid') ?? '';
      return !t.startsWith('card-agent-') && !t.startsWith('card-yolo-');
    });
    for (const card of cards.slice(0, max)) {
      const id = card.getAttribute('data-testid') ?? '';
      const svg = card.querySelector('svg');
      if (id && svg) out[id] = svg.outerHTML;
    }
    return out;
  }, limit);
}

/** Snapshot the board: column id → sorted card testids (AC33 determinism comparison). */
export async function boardSnapshot(page: Page): Promise<Record<string, string[]>> {
  return page.evaluate(() => {
    const out: Record<string, string[]> = {};
    for (const lane of Array.from(document.querySelectorAll('[data-testid^="kanban-col-"]'))) {
      const col = (lane.getAttribute('data-testid') ?? '').slice('kanban-col-'.length);
      out[col] = Array.from(lane.querySelectorAll('[data-testid^="card-"]'))
        .map((el) => el.getAttribute('data-testid') ?? '')
        .filter((t) => t.startsWith('card-') && !t.startsWith('card-agent-') && !t.startsWith('card-yolo-'))
        .sort();
    }
    return out;
  });
}

/**
 * Find (or, failing that, commission via the Foundry) a single backlog card of `kind`.
 * SPEC-V3 §V3-7: the Foundry keeps ONLY the Commission Task tab; SPEC-V2 §V2-6: kind picker
 * offers the full kind list, deterministic default title, sim verb `createTask`.
 * Foundry control testids are unknowable — interact by visible text.
 */
export async function ensureBacklogCardOfKind(page: Page, kind: TaskKind): Promise<string> {
  const existing = (await singleCardsIn(page, 'backlog')).find((c) => c.kind === kind);
  if (existing) return existing.taskId;
  const before = new Set((await singleCardsIn(page, 'backlog')).map((c) => c.taskId));
  await commissionTask(page, kind);
  const after = await singleCardsIn(page, 'backlog');
  const created = after.find((c) => !before.has(c.taskId));
  if (!created) {
    throw new Error(
      `Commissioning a "${kind}" task via the Foundry did not add a new backlog card ` +
        '(SPEC-V2 §V2-6: submit → sim verb createTask → new queued task appears).',
    );
  }
  return created.taskId;
}

/** Open the Foundry (N key, SPEC-V2 §V2-6) and commission a task of `kind` with the default title. */
export async function commissionTask(page: Page, kind: TaskKind): Promise<void> {
  await page.keyboard.press('n');
  const foundry = page.locator(SEL3.foundry);
  await expect(
    foundry,
    'Foundry dialog (data-testid="foundry") should open on N (SPEC-V2 §V2-6).',
  ).toBeVisible();
  // Pick the task kind — controls are unknowable; try a native <select>, else click the kind text.
  const select = foundry.locator('select').first();
  if (await select.count()) {
    await select.selectOption({ label: kind }).catch(async () => {
      await select.selectOption(kind).catch(() => undefined);
    });
  } else {
    await foundry
      .getByText(new RegExp(`^\\s*${kind.replace(/-/g, '[-\\s]?')}\\s*$`, 'i'))
      .first()
      .click();
  }
  // Submit (default deterministic title) — match a commission/create/submit-ish button.
  await foundry
    .locator('button', { hasText: /commission|create|submit|forge task/i })
    .first()
    .click();
  await expect(
    foundry,
    'Foundry should close after a successful Commission Task submit (SPEC-V2 §V2-6).',
  ).toBeHidden();
  await tick(page, 1);
}
