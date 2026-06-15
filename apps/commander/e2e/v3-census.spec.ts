/**
 * v3-census.spec.ts — SPEC-V3 §V3-6: AC33 (SVG census + determinism). Also carries the V3
 * reinterpretation of V2 AC24: with the LinkLayer RETIRED, the census rule simplifies to
 * "zero <line>/<polyline> elements document-wide, always" (SPEC-V3 preamble), and same-seed
 * reload still yields byte-identical procedural icons.
 *
 * FROZEN input for implementation.
 */
import { expect, test } from '@playwright/test';
import { tick } from './helpers';
import {
  boardSnapshot,
  bootBoard,
  captureCardIcons,
  countLinePolyline,
  moveCardViaSim,
  SEL3,
  singleCardsIn,
} from './helpers-v3';

test('AC33: zero <line>/<polyline> document-wide at every checkpoint (boot, working board, overlays open)', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  // Checkpoint 1: boot.
  expect(await countLinePolyline(page), 'zero <line>/<polyline> at boot (AC33)').toBe(0);

  // Checkpoint 2: cards working (agents, progress rings, connector curves must all be <path>).
  const singles = await singleCardsIn(page, 'backlog');
  for (const c of singles.slice(0, 2)) await moveCardViaSim(page, c.taskId, 'do');
  await tick(page, 100);
  expect(await countLinePolyline(page), 'zero <line>/<polyline> with agents working (AC33)').toBe(0);

  // Checkpoint 3: Archive overlay open — V2-3: memory edges are <path>, NEVER <line>/<polyline>.
  await page.keyboard.press('m');
  await expect(page.locator(SEL3.memoryOverlay)).toBeVisible();
  expect(await countLinePolyline(page), 'zero <line>/<polyline> with the Archive overlay open (AC33)').toBe(0);
  await page.keyboard.press('Escape');

  // Checkpoint 4: Foundry open.
  await page.keyboard.press('n');
  await expect(page.locator(SEL3.foundry)).toBeVisible();
  expect(await countLinePolyline(page), 'zero <line>/<polyline> with the Foundry open (AC33)').toBe(0);
});

test('AC33: same-seed reload renders byte-identical card seal icons', async ({ page }) => {
  await bootBoard(page, { seed: 42 });
  const first = await captureCardIcons(page, 10);
  expect(Object.keys(first).length, 'cards must render inline SVG wax-seal icons (§V3-1)').toBeGreaterThan(0);

  await bootBoard(page, { seed: 42 });
  const second = await captureCardIcons(page, 10);

  // "same-seed reload renders byte-identical card seal icons" (AC33; SPEC §8 byte-identity rule).
  expect(Object.keys(second).sort()).toEqual(Object.keys(first).sort());
  for (const [id, svg] of Object.entries(first)) {
    expect(second[id], `card icon SVG for ${id} must be byte-identical across same-seed reloads (AC33)`).toBe(svg);
  }
});

test('AC33: same seed + identical drag sequences via sim verbs ⇒ identical board states', async ({
  page,
}) => {
  // Run the identical verb+tick script twice from the same seed and compare board snapshots
  // (SPEC-V3 §V3-7: "same seed + same verb sequence ⇒ identical board").
  const runScript = async (): Promise<Record<string, string[]>> => {
    await bootBoard(page, { seed: 42 });
    const singles = await singleCardsIn(page, 'backlog');
    expect(singles.length).toBeGreaterThanOrEqual(2);
    // Deterministic verb sequence: start the first two singles (sorted for order stability).
    const ids = singles.map((c) => c.taskId).sort();
    await moveCardViaSim(page, ids[0], 'do');
    await tick(page, 50);
    await moveCardViaSim(page, ids[1], 'do');
    await tick(page, 200);
    return boardSnapshot(page);
  };

  const snapA = await runScript();
  const snapB = await runScript();
  expect(snapB, 'identical seed + identical moveCard/tick sequence must yield an identical board (AC33)').toEqual(
    snapA,
  );
});
