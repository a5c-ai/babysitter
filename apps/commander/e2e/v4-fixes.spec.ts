/**
 * v4-fixes.spec.ts — SPEC-V4 bug fixes + pacing: AC36 (drag stacking order, §V4-2),
 * AC37 (Inspect retargeting, §V4-3), AC38 (speed control + tick determinism, §V4-4).
 *
 * FROZEN input for implementation. Determinism: /?seed=42, pause-on-boot, sim.tick(n) only.
 */
import { expect, test, type Page } from '@playwright/test';
import { tick, tickUntil } from './helpers';
import {
  agentsOnCard,
  boardSnapshot,
  bootBoard,
  cardById,
  cardsInColumn,
  moveCardViaSim,
  SEL3,
  singleCardsIn,
} from './helpers-v3';
import {
  beginCardDrag,
  elementAtPoint,
  getSimPacing,
  isTabActive,
  openInspectorFor,
  pickBacklogSingle,
  SEL4,
} from './helpers-v4';

test('AC36: during an active pointer drag the dragged card is topmost — elementFromPoint resolves to the drag ghost, never a lane', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });
  const { taskId } = await pickBacklogSingle(page);

  // Start a REAL pointer drag (first half of the helpers-v3 dragCard sequence) and freeze
  // mid-flight over the board — the ghost tracks the pointer (§V4-2).
  const mid = await beginCardDrag(page, taskId, 'do');

  // AC36: "elementFromPoint at the card's center returns the drag ghost (not a lane)".
  // The ghost rides the pointer, so probe at the live pointer position.
  const hit = await elementAtPoint(page, mid.x, mid.y);
  expect(
    hit.cardAncestor === `card-${taskId}` || hit.inGhostLayer,
    `the topmost element under the dragged card must be the drag ghost / the card itself ` +
      `(AC36/§V4-2: "render the drag ghost into a top-level layer"); got testid="${hit.selfTestid}" ` +
      `class="${hit.classes}" cardAncestor="${hit.cardAncestor}"`,
  ).toBe(true);

  // AC36: "no occlusion class applies" — a lane (or HUD chrome) must never be the topmost hit.
  expect(
    hit.laneIsTopmost,
    `a kanban lane occludes the dragged card at (${mid.x}, ${mid.y}) — §V4-2 requires the ` +
      `moving card topmost above all lanes and HUD chrome`,
  ).toBe(false);

  // Complete the drag cleanly onto DO and verify the board accepted it (no stuck ghost).
  const lane = page.locator('[data-testid="kanban-col-do"]');
  const laneBox = await lane.boundingBox();
  if (!laneBox) throw new Error('kanban-col-do has no bounding box');
  await page.mouse.move(laneBox.x + laneBox.width / 2, laneBox.y + Math.min(laneBox.height / 2, 120), {
    steps: 6,
  });
  await page.mouse.up();
  await expect
    .poll(() => cardsInColumn(page, 'do').locator(`[data-testid="card-${taskId}"]`).count(), {
      message: `card-${taskId} must land in DO after the completed drag (clean finish, AC36)`,
    })
    .toBe(1);
});

test('AC37: Inspect on entity B while the Inspector shows entity A retargets the open Inspector, preserving the selected tab', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  // Two working cards so both entities support the Transcript/Process tab set (§V2-5/§V3-1).
  const singles = await singleCardsIn(page, 'backlog');
  expect(singles.length).toBeGreaterThanOrEqual(2);
  const [a, b] = singles;
  await moveCardViaSim(page, a.taskId, 'do');
  await moveCardViaSim(page, b.taskId, 'do');
  const bothWorking = await tickUntil(
    page,
    async () =>
      (await agentsOnCard(page, a.taskId).count()) > 0 &&
      (await agentsOnCard(page, b.taskId).count()) > 0,
    { chunk: 5, maxChunks: 80 },
  );
  expect(bothWorking, 'both cards must have attending workers in DO (AC37 setup, §V3-2)').toBe(true);

  // Open the Inspector on A and switch to the Process tab.
  const inspector = await openInspectorFor(page, a.taskId);
  const processTab = page.locator(SEL3.inspectorTabProcess);
  await processTab.click();
  await expect
    .poll(() => isTabActive(processTab), { message: 'Process tab must activate for entity A (V2-5)' })
    .toBe(true);

  // Watch for any unmount of the inspector node — §V4-3: retarget "without closing/reopening".
  await page.evaluate(() => {
    const w = window as unknown as { __inspectorRemovals?: number; __inspectorObs?: MutationObserver };
    w.__inspectorRemovals = 0;
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of Array.from(m.removedNodes)) {
          if (
            node instanceof Element &&
            (node.matches('[data-testid="inspector"]') || node.querySelector('[data-testid="inspector"]'))
          ) {
            w.__inspectorRemovals = (w.__inspectorRemovals ?? 0) + 1;
          }
        }
      }
    });
    obs.observe(document.body, { subtree: true, childList: true });
    w.__inspectorObs = obs;
  });

  // Invoke Inspect on B (double-click is an Inspect surface, §V3-1/§V4-3).
  await cardById(page, b.taskId).dblclick();

  // The SAME Inspector retargets: still visible, header/content re-rendered for B.
  await expect(inspector).toBeVisible();
  // The card's serif title is its longest text line (§V3-1 card anatomy) — match a fragment.
  const bTitleFragment = b.title
    .split('\n')
    .map((l) => l.trim())
    .sort((x, y) => y.length - x.length)[0]
    .slice(0, 12)
    .trim();
  await expect
    .poll(async () => (await inspector.innerText()).toLowerCase(), {
      message: `the open Inspector must re-render its header for entity B ("${bTitleFragment}") — §V4-3 retargeting`,
    })
    .toContain(bTitleFragment.toLowerCase());

  const removals = await page.evaluate(() => {
    const w = window as unknown as { __inspectorRemovals?: number };
    return w.__inspectorRemovals ?? 0;
  });
  expect(
    removals,
    'the Inspector must NOT close/reopen (no unmount of [data-testid="inspector"]) while retargeting (AC37/§V4-3)',
  ).toBe(0);

  // "selected tab preserved when the new entity supports it" — B is a working card, so the
  // Process tab remains selected.
  await expect
    .poll(() => isTabActive(page.locator(SEL3.inspectorTabProcess)), {
      message: 'the Process tab must remain selected after retargeting to entity B (AC37/§V4-3)',
    })
    .toBe(true);
});

/** Run the same deterministic verb script and return the resulting board snapshot. */
async function scriptedSnapshot(page: Page): Promise<Record<string, string[]>> {
  const singles = await singleCardsIn(page, 'backlog');
  const ids = singles
    .map((c) => c.taskId)
    .sort()
    .slice(0, 2);
  for (const id of ids) await moveCardViaSim(page, id, 'do');
  await tick(page, 60);
  return boardSnapshot(page);
}

test('AC38: topbar-speed cycles 0.5x/1x/2x (tickIntervalMs 1600/800/400, default 800); pause + tick(n) determinism is unaffected by speed', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  // AC38: "default is 800" (§V4-4: default real-time auto-tick interval is 800ms).
  const initial = await getSimPacing(page);
  expect(initial.tickIntervalMs, 'sim.tickIntervalMs must default to 800 (AC38/§V4-4)').toBe(800);

  const speedControl = page.locator(SEL4.topbarSpeed);
  await expect(speedControl, 'topbar-speed control must render (§V4-4)').toBeVisible();

  // AC38: cycling visits all of 0.5x/1x/2x — intervals {1600, 800, 400} — and the label shows
  // the current multiplier; after a full cycle (3 clicks) it returns to the default.
  const seenIntervals: number[] = [initial.tickIntervalMs];
  const seenLabels: string[] = [((await speedControl.textContent()) ?? '').trim()];
  for (let i = 0; i < 3; i++) {
    await speedControl.click();
    const pacing = await getSimPacing(page);
    seenIntervals.push(pacing.tickIntervalMs);
    seenLabels.push(((await speedControl.textContent()) ?? '').trim());
  }
  expect(
    new Set(seenIntervals),
    `cycling topbar-speed must visit intervals 1600/800/400 (AC38/§V4-4); saw ${JSON.stringify(seenIntervals)}`,
  ).toEqual(new Set([1600, 800, 400]));
  expect(
    seenIntervals[3],
    `after a full 3-click cycle the interval must return to its starting value (AC38); saw ${JSON.stringify(seenIntervals)}`,
  ).toBe(seenIntervals[0]);
  expect(
    seenLabels.every((l) => /[0-9.]+\s*[x×]/i.test(l)),
    `the speed label must show the current multiplier (§V4-4: "label shows current"); saw ${JSON.stringify(seenLabels)}`,
  ).toBe(true);

  // Determinism: same seed + same verb script ⇒ identical board, regardless of the speed
  // setting ("pause + tick(n) determinism unaffected", AC38; §V4-4 "tick(n) test semantics
  // are unchanged"). Run 1 at whatever speed the cycle landed on:
  const snapshotRun1 = await scriptedSnapshot(page);

  // Run 2: fresh boot, switch to a DIFFERENT speed first, replay the identical script.
  await bootBoard(page, { seed: 42 });
  await page.locator(SEL4.topbarSpeed).click();
  const pacing2 = await getSimPacing(page);
  expect([1600, 800, 400]).toContain(pacing2.tickIntervalMs);
  const snapshotRun2 = await scriptedSnapshot(page);

  expect(
    snapshotRun2,
    'board snapshots must be identical for the same seed + verb script at different speed settings (AC38/§V4-4)',
  ).toEqual(snapshotRun1);
});
