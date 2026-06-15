/**
 * v2-workspace.spec.ts — SPEC-V2 §V2-8 AC22 (Inspector Workspace tab, V2-7), reinterpreted
 * under SPEC-V3: "the Inspector Workspace tab remains for cards in other columns" (§V3-4) —
 * exercised here on a working DO card. The human-review panel surface (and the write-back
 * approve/reject paths of V2 AC23) are covered by AC30 in v3-review-flow.spec.ts.
 *
 * FROZEN input for implementation.
 * tickUntil budgets in this file doubled per SPEC-V4 §V4-4 pacing (sanctioned; non-semantic).
 */
import { expect, test } from '@playwright/test';
import { tickUntil } from './helpers';
import {
  agentsOnCard,
  bootBoard,
  cardById,
  diffHasAdditionAndDeletion,
  moveCardViaSim,
  SEL3,
  singleCardsIn,
} from './helpers-v3';

test('AC22: a working card\'s Workspace tab lists ≥2 changed files with status letters; the first file opens a diff with addition and deletion rows; header shows branch and a dirty badge', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  // Start a card working so workspace changes accumulate (V2-7 sim; §V3-2: changes accumulate
  // automatically while the worker agent runs).
  const singles = await singleCardsIn(page, 'backlog');
  expect(singles.length).toBeGreaterThan(0);
  const taskId = singles[0].taskId;
  await moveCardViaSim(page, taskId, 'do');
  const working = await tickUntil(page, async () => (await agentsOnCard(page, taskId).count()) > 0, {
    chunk: 5,
    maxChunks: 80,
  });
  expect(working, `a worker must spawn on card-${taskId} (§V3-2)`).toBe(true);

  // Open the Inspector (double-click, §V3-1) and switch to the Workspace tab (V2-7).
  await cardById(page, taskId).dblclick();
  const inspector = page.locator(SEL3.inspector);
  await expect(inspector).toBeVisible();
  await inspector.locator(SEL3.inspectorTabWorkspace).click();

  // AC22: "lists ≥2 changed files with status letters" — tick until the deterministic
  // changed-file list (statuses A/M/D, V2-7) has accumulated ≥2 entries.
  const fileCount = async () => inspector.locator(SEL3.wsFile).count();
  const enough = await tickUntil(page, async () => (await fileCount()) >= 2, {
    chunk: 10,
    maxChunks: 160,
  });
  expect(
    enough,
    `the Workspace tab must list ≥2 changed files (ws-file-<index>) within 800 ticks (AC22); saw ${await fileCount()}`,
  ).toBe(true);
  // Status letters A/M/D on the entries (V2-7: "status letter + path").
  const firstFileText = (await inspector.locator('[data-testid="ws-file-0"]').innerText()).trim();
  expect(
    /(^|\s)[AMD](\s|$)/.test(firstFileText),
    `changed-file rows must carry an A/M/D status letter (AC22/V2-7); first row: "${firstFileText}"`,
  ).toBe(true);

  // AC22: "the header shows branch and a dirty badge" — V2-7 header: branch, short headSha,
  // dirty badge with uncommittedCount, workspace phase, test evidence chip.
  const tabText = (await inspector.innerText()).toLowerCase();
  expect(
    /dirty|uncommitted/.test(tabText),
    `the Workspace header must show a dirty badge (AC22/V2-7); tab text: ${tabText.slice(0, 400)}`,
  ).toBe(true);
  expect(
    /\b[0-9a-f]{7,12}\b/.test(tabText),
    'the Workspace header must show a short headSha (V2-7 gitStatus.headSha)',
  ).toBe(true);

  // AC22: "clicking the first shows a diff plate containing both an addition row and a
  // deletion row" (V2-7: verdigris additions, garnet deletions, synthetic unified diff).
  await inspector.locator('[data-testid="ws-file-0"]').click();
  await expect
    .poll(() => diffHasAdditionAndDeletion(inspector), {
      message: 'the diff plate must contain both an addition row and a deletion row (AC22)',
    })
    .toBe(true);
});
