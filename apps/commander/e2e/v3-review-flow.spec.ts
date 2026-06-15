/**
 * v3-review-flow.spec.ts — SPEC-V3 §V3-6: AC28 (review verdicts), AC29 (yolo), AC30 (human
 * review panel — also covers the surviving intent of V2 AC23 write-back approval), AC31
 * (integration / merged seal).
 *
 * FROZEN input for implementation. Setup uses the sim verb `moveCard` (the real pointer drag
 * is proven by AC26 in v3-board.spec.ts; SPEC-V3 §V3-7 sanctions verb-driven movement —
 * "All board movement flows through deterministic sim verbs (user drags included)").
 *
 * AMENDED per the SPEC-V4 header (sanctioned product change, §V4-1): the merged seal /
 * terminal state moves from the APPROVED column to the MERGED column — an approved card
 * completing integration AUTO-moves to `merged`, and AC31 now asserts the seal there.
 * tickUntil budgets in this file are doubled for the §V4-4 pacing slowdown (non-semantic).
 */
import { expect, test } from '@playwright/test';
import { tickUntil } from './helpers';
import {
  agentsOnCard,
  bootBoard,
  cardById,
  cardsInColumn,
  columnOfCard,
  diffHasAdditionAndDeletion,
  dragCard,
  moveCardViaSim,
  SEL3,
  singleCardsIn,
  tickerTexts,
  tickUntilCardInColumn,
  yoloToggle,
  type ColumnId,
} from './helpers-v3';

/** Track per-card column history while ticking, until `done` says stop. */
async function tickTrackingHistory(
  page: import('@playwright/test').Page,
  taskIds: string[],
  done: (history: Map<string, ColumnId[]>) => boolean,
  opts: { chunk?: number; maxChunks?: number } = {},
): Promise<Map<string, ColumnId[]>> {
  const { chunk = 10, maxChunks = 160 } = opts;
  const history = new Map<string, ColumnId[]>();
  const record = async () => {
    for (const id of taskIds) {
      const col = await columnOfCard(page, id);
      if (!col) continue;
      const h = history.get(id) ?? [];
      if (h[h.length - 1] !== col) h.push(col);
      history.set(id, h);
    }
  };
  await record();
  await tickUntil(
    page,
    async () => {
      await record();
      return done(history);
    },
    { chunk, maxChunks },
  );
  return history;
}

test('AC28: non-yolo pass lands in HUMAN REVIEW with no agents; a rejected card returns to DO with feedback and a fresh worker', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  // Start work on every single backlog card so the deterministic AI verdicts (§V3-2) produce
  // both a PASS (→ human-review) and a REJECT (→ back to do) within the budget.
  const singles = await singleCardsIn(page, 'backlog');
  expect(singles.length, 'boot backlog must contain several single cards (§V3-2)').toBeGreaterThanOrEqual(
    2,
  );
  for (const c of singles) await moveCardViaSim(page, c.taskId, 'do');

  const ids = singles.map((c) => c.taskId);
  const passed = (h: Map<string, ColumnId[]>) =>
    [...h.values()].some((cols) => cols[cols.length - 1] === 'human-review');
  const rejected = (h: Map<string, ColumnId[]>) =>
    [...h.entries()].some(([, cols]) =>
      cols.some((c, i) => c === 'ai-review' && cols[i + 1] === 'do'),
    );

  const history = await tickTrackingHistory(page, ids, (h) => passed(h) && rejected(h), {
    chunk: 10,
    maxChunks: 160,
  });
  const dump = JSON.stringify([...history.entries()]);

  // AC28: "a non-yolo card passing AI review lands in HUMAN REVIEW (no agents attached)".
  const passCard = [...history.entries()].find(([, cols]) => cols[cols.length - 1] === 'human-review');
  expect(passCard, `some card must pass AI review into HUMAN REVIEW within 1600 ticks; histories: ${dump}`).toBeTruthy();
  // §V3-2: "HUMAN REVIEW: no agents attend."
  await expect(agentsOnCard(page, passCard![0])).toHaveCount(0);

  // AC28: "a rejected card returns to DO with a feedback ticker event and a fresh worker".
  const rejectEntry = [...history.entries()].find(([, cols]) =>
    cols.some((c, i) => c === 'ai-review' && cols[i + 1] === 'do'),
  );
  expect(
    rejectEntry,
    `some card must be REJECTED by AI review and bounce back to DO within 1600 ticks; histories: ${dump}`,
  ).toBeTruthy();
  const texts = await tickerTexts(page);
  expect(
    texts.some((t) => /feedback|reject|request(ed)? changes|changes requested/i.test(t)),
    `a feedback/rejection ticker event must be logged for the bounced card (AC28); ticker tail: ${JSON.stringify(texts.slice(-15))}`,
  ).toBe(true);
  // "a fresh worker spawns and iterates" (§V3-2) — the bounced card has an attending agent
  // (unless it already finished its rework and moved on; then its history shows do → ai-review again).
  const [rejId, rejCols] = rejectEntry!;
  const reworked = rejCols.filter((c) => c === 'do').length >= 2 && rejCols[rejCols.length - 1] !== 'do';
  if (!reworked) {
    const freshWorker = await tickUntil(page, async () => (await agentsOnCard(page, rejId).count()) > 0, {
      chunk: 5,
      maxChunks: 80,
    });
    expect(freshWorker, `a fresh worker must attend the bounced card-${rejId} back in DO (AC28)`).toBe(true);
  }
});

test('AC29: a yolo-flagged card passing AI review lands directly in APPROVED, skipping HUMAN REVIEW', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  const singles = await singleCardsIn(page, 'backlog');
  expect(singles.length).toBeGreaterThan(0);

  // Flag EVERY single card yolo before any review completes (§V3-1 yolo toggle), then start them
  // all — whichever passes AI review must skip HUMAN REVIEW (AC29). Toggle first, then move.
  for (const c of singles) {
    await yoloToggle(page, c.taskId).click();
    await moveCardViaSim(page, c.taskId, 'do');
  }

  const ids = singles.map((c) => c.taskId);
  const history = await tickTrackingHistory(
    page,
    ids,
    (h) => [...h.values()].some((cols) => cols.includes('approved')),
    { chunk: 10, maxChunks: 160 },
  );
  const dump = JSON.stringify([...history.entries()]);
  const winner = [...history.entries()].find(([, cols]) => cols.includes('approved'));
  expect(winner, `some yolo card must pass AI review into APPROVED within 1600 ticks; histories: ${dump}`).toBeTruthy();

  // AC29: "lands it in APPROVED, skipping HUMAN REVIEW".
  expect(
    winner![1],
    `yolo card ${winner![0]} must never pass through HUMAN REVIEW (AC29); history: ${JSON.stringify(winner![1])}`,
  ).not.toContain('human-review');
});

test('AC30 + AC31 (as amended by SPEC-V4 §V4-1): human review panel (files, diff, Approve All), drag-back verdict, then integration auto-moves to the MERGED column', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  // Drive at least two cards to HUMAN REVIEW (non-yolo path).
  const singles = await singleCardsIn(page, 'backlog');
  for (const c of singles) await moveCardViaSim(page, c.taskId, 'do');
  const ids = singles.map((c) => c.taskId);
  await tickUntil(
    page,
    async () => (await cardsInColumn(page, 'human-review').count()) >= 2,
    { chunk: 10, maxChunks: 160 },
  ).then((ok) => {
    expect(ok, '≥2 cards must reach HUMAN REVIEW within 1600 ticks (AC30 needs a second card for the drag-back verdict)').toBe(true);
  });

  const inReview: string[] = [];
  for (const id of ids) {
    if ((await columnOfCard(page, id)) === 'human-review') inReview.push(id);
  }
  expect(inReview.length).toBeGreaterThanOrEqual(2);
  const [approveId, dragBackId] = inReview;

  // AC30: "clicking a HUMAN REVIEW card opens review-panel with ≥2 changed files and a diff
  // containing addition and deletion rows" (§V3-4, re-homed V2-7 workspace surface).
  await cardById(page, approveId).click();
  const panel = page.locator(SEL3.reviewPanel);
  await expect(panel).toBeVisible();
  await expect
    .poll(() => panel.locator(SEL3.wsFile).count(), {
      message: 'review-panel must list ≥2 changed files (AC30, ws-file-<index>)',
    })
    .toBeGreaterThanOrEqual(2);
  await panel.locator('[data-testid="ws-file-0"]').click();
  await expect
    .poll(() => diffHasAdditionAndDeletion(panel), {
      message: 'the diff plate must contain both an addition row and a deletion row (AC30/§V3-4)',
    })
    .toBe(true);

  // AC30: "Approve All animates the card to APPROVED" (also the surviving V2 AC23 approve path).
  await panel.locator(SEL3.reviewApproveAll).click();
  await tickUntilCardInColumn(page, approveId, 'approved', { chunk: 5, maxChunks: 80 });

  // AC30: "(separate card) dragging from HUMAN REVIEW back to DO works" (§V3-1 user drag verdict;
  // surviving V2 AC23 request-changes path: the unit returns to working).
  await dragCard(page, dragBackId, 'do');
  await expect
    .poll(() => cardsInColumn(page, 'do').locator(`[data-testid="card-${dragBackId}"]`).count(), {
      message: `card-${dragBackId} must land back in DO when dragged out of HUMAN REVIEW (AC30)`,
    })
    .toBe(1);

  // AC31 — AMENDED per the SPEC-V4 header + §V4-1 (sanctioned product change): the merged
  // terminal state moves from APPROVED to the MERGED column. "An APPROVED card shows
  // merge/rebase activity events" and, when integration completes, AUTO-MOVES to the MERGED
  // column where the merged seal now lives ("Approved no longer holds terminal cards"); its
  // integration agent despawns after (§V3-2 INTEGRATION agent).
  let sawIntegrationAgent = false;
  const isMerged = async (): Promise<boolean> =>
    cardById(page, approveId).evaluate((el: Element) => {
      if (/\bmerged\b/i.test(el.getAttribute('class') ?? '')) return true;
      if ((el.getAttribute('data-state') ?? '').toLowerCase() === 'merged') return true;
      if (el.querySelector('[data-testid*="merged"], [class*="merged"]')) return true;
      return false;
    });
  const merged = await tickUntil(
    page,
    async () => {
      if ((await agentsOnCard(page, approveId).count()) > 0) sawIntegrationAgent = true;
      return (await columnOfCard(page, approveId)) === 'merged';
    },
    { chunk: 10, maxChunks: 160 },
  );
  expect(
    merged,
    `card-${approveId} must AUTO-move to the MERGED column within 1600 ticks (AC31 as amended by SPEC-V4 §V4-1)`,
  ).toBe(true);
  await expect
    .poll(isMerged, {
      message: `card-${approveId} must carry the merged seal in the MERGED column (AC31 as amended by SPEC-V4 §V4-1: "the merged seal now lives there")`,
    })
    .toBe(true);
  expect(
    sawIntegrationAgent,
    `an integration agent must visibly attend card-${approveId} during merge (AC31/§V3-2)`,
  ).toBe(true);
  // Merge/rebase activity events in the ticker.
  const texts = await tickerTexts(page);
  expect(
    texts.some((t) => /merge|rebase|integrat/i.test(t)),
    `ticker must log merge/rebase/integration activity (AC31); tail: ${JSON.stringify(texts.slice(-15))}`,
  ).toBe(true);
  // "its integration agent despawning after".
  await expect
    .poll(() => agentsOnCard(page, approveId).count(), {
      message: 'the integration agent must despawn after the merged seal (AC31)',
    })
    .toBe(0);
});
