/**
 * v4-release.spec.ts — SPEC-V4 §V4-1 release rail: AC34 (seven lanes + auto-move to MERGED),
 * AC35 (Revert / col-release release train / Rollback).
 *
 * FROZEN input for implementation. Determinism: /?seed=42, pause-on-boot, sim.tick(n) only;
 * setup uses sanctioned sim verbs (moveCard per §V3-7; revert/release/rollback are exercised
 * through their UI surfaces because those ARE the thing under test).
 */
import { expect, test } from '@playwright/test';
import { tick, tickUntil } from './helpers';
import {
  agentsOnCard,
  bootBoard,
  cardsInColumn,
  column,
  columnOfCard,
  COLUMNS,
  movedCardIds,
  tickerTexts,
  watchIsMoving,
} from './helpers-v3';
import {
  driveCardsToMerged,
  hasMergedSeal,
  invokeCardCommand,
  SEL4,
  tickUntilCardInColumnV4,
  V4_BUDGET,
} from './helpers-v4';

test('AC34: seven lanes render; an approved card completing integration AUTO-moves to MERGED carrying the merged seal; approved holds no terminal cards', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  // AC34: "Seven lanes render with testids" (§V4-1: backlog, do, ai-review, human-review,
  // approved, merged, in-production — incl. kanban-col-merged / kanban-col-in-production).
  expect(COLUMNS.length, 'the column contract is seven lanes (SPEC-V4 §V4-1)').toBe(7);
  for (const id of COLUMNS) {
    await expect(column(page, id), `kanban-col-${id} must exist (SPEC-V4 §V4-1)`).toBeVisible();
  }

  // Drive a yolo card down the rail. §V4-1: APPROVED = integration in progress; when
  // integration completes the card AUTO-MOVES to MERGED.
  const [mergedId] = await driveCardsToMerged(page, 1);

  // AC34: the merged seal now lives on the card IN the merged column.
  expect(await columnOfCard(page, mergedId)).toBe('merged');
  await expect
    .poll(() => hasMergedSeal(page, mergedId), {
      message: `card-${mergedId} must carry the merged seal in the MERGED column (AC34/§V4-1: "the merged seal now lives there")`,
    })
    .toBe(true);

  // AC34: "no terminal cards remain in approved" — give integration time to drain, then assert
  // nothing sitting in APPROVED carries the merged seal.
  await tick(page, 50);
  const sealedInApproved = await page.evaluate(() => {
    const lane = document.querySelector('[data-testid="kanban-col-approved"]');
    if (!lane) return [] as string[];
    return Array.from(lane.querySelectorAll('[data-testid^="card-"]'))
      .filter((el) => {
        const t = el.getAttribute('data-testid') ?? '';
        return t.startsWith('card-') && !t.startsWith('card-agent-') && !t.startsWith('card-yolo-');
      })
      .filter(
        (el) =>
          /\bmerged\b/i.test(el.getAttribute('class') ?? '') ||
          (el.getAttribute('data-state') ?? '').toLowerCase() === 'merged' ||
          el.querySelector('[data-testid*="merged"], [class*="merged"]') !== null,
      )
      .map((el) => el.getAttribute('data-testid') ?? '');
  });
  expect(
    sealedInApproved,
    `APPROVED no longer holds terminal (merged-sealed) cards (AC34/§V4-1); offenders: ${JSON.stringify(sealedInApproved)}`,
  ).toEqual([]);
});

test('AC35: merged Revert returns the card to DO with a fresh worker; col-release ships ALL merged cards to IN PRODUCTION; Rollback returns one to MERGED', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  // Drive ≥2 cards to MERGED so one can be reverted while another rides the release train.
  const merged = await driveCardsToMerged(page, 2);
  const [revertId] = merged;

  // ---- Revert (§V4-1: merged-card contextual command, danger) ----
  const tickerBefore = (await tickerTexts(page)).length;
  await invokeCardCommand(page, revertId, /revert/i);
  await tickUntilCardInColumnV4(page, revertId, 'do', V4_BUDGET);

  // "with a `reverted` feedback event".
  const revertLogged = await tickUntil(
    page,
    async () =>
      (await tickerTexts(page))
        .slice(tickerBefore)
        .some((t) => /revert/i.test(t)),
    { chunk: 5, maxChunks: 40 },
  );
  expect(
    revertLogged,
    `a reverted event must be logged to the ticker after Revert on card-${revertId} (AC35/§V4-1)`,
  ).toBe(true);

  // "a fresh worker iterates" — an agent attends the reverted card back in DO (unless its
  // rework already finished and it moved on — then it is simply no longer in DO).
  if ((await columnOfCard(page, revertId)) === 'do') {
    const freshWorker = await tickUntil(
      page,
      async () => (await agentsOnCard(page, revertId).count()) > 0,
      { chunk: 5, maxChunks: 80 },
    );
    expect(
      freshWorker,
      `a fresh worker must attend the reverted card-${revertId} in DO (AC35/§V4-1)`,
    ).toBe(true);
  }

  // ---- Release (§V4-1: MERGED column command `col-release`, enabled when lane non-empty) ----
  // Whatever sits in MERGED at this instant must ALL ship as one release train.
  await expect
    .poll(() => cardsInColumn(page, 'merged').count(), {
      message: 'MERGED must still hold ≥1 card for the release train (AC35 setup)',
    })
    .toBeGreaterThanOrEqual(1);
  const trainIds = await page.evaluate(() => {
    const lane = document.querySelector('[data-testid="kanban-col-merged"]');
    return Array.from(lane?.querySelectorAll('[data-testid^="card-"]') ?? [])
      .map((el) => el.getAttribute('data-testid') ?? '')
      .filter((t) => t.startsWith('card-') && !t.startsWith('card-agent-') && !t.startsWith('card-yolo-'))
      .map((t) => t.slice('card-'.length));
  });
  await watchIsMoving(page);

  const releaseLever = page.locator(SEL4.colRelease);
  await expect(
    releaseLever,
    'the brass release lever (data-testid="col-release") must render in the MERGED lane header and be enabled when the lane is non-empty (§V4-1)',
  ).toBeEnabled();
  const tickerBeforeRelease = (await tickerTexts(page)).length;
  await releaseLever.click();

  // "promotes ALL merged cards to In Production as one release train".
  for (const id of trainIds) {
    await tickUntilCardInColumnV4(page, id, 'in-production', V4_BUDGET);
  }

  // "staggered glide animation" — each shipped card carried is-moving at some point (AC35).
  const moved = await movedCardIds(page);
  for (const id of trainIds) {
    expect(
      moved,
      `card-${id} must carry the is-moving class during the release glide (AC35/§V3-3 e2e hook); seen moving: ${JSON.stringify(moved)}`,
    ).toContain(`card-${id}`);
  }

  // "`release_shipped` events, deterministic release id rel-NN".
  const releaseLogged = await tickUntil(
    page,
    async () =>
      (await tickerTexts(page))
        .slice(tickerBeforeRelease)
        .some((t) => /release|ship|rel-\d+/i.test(t)),
    { chunk: 5, maxChunks: 40 },
  );
  expect(
    releaseLogged,
    'a release event (release_shipped / rel-NN) must be logged to the ticker (AC35/§V4-1)',
  ).toBe(true);

  // ---- Rollback (§V4-1: in-production contextual command, danger) ----
  const rollbackId = trainIds[0];
  const tickerBeforeRollback = (await tickerTexts(page)).length;
  await invokeCardCommand(page, rollbackId, /rollback/i);
  await tickUntilCardInColumnV4(page, rollbackId, 'merged', V4_BUDGET);
  const rollbackLogged = await tickUntil(
    page,
    async () =>
      (await tickerTexts(page))
        .slice(tickerBeforeRollback)
        .some((t) => /roll(ed)?[\s_-]?back/i.test(t)),
    { chunk: 5, maxChunks: 40 },
  );
  expect(
    rollbackLogged,
    `a rolled_back event must be logged when card-${rollbackId} is rolled back to MERGED (AC35/§V4-1)`,
  ).toBe(true);
});
