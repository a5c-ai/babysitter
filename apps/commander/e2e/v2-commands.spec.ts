/**
 * v2-commands.spec.ts — SPEC-V2 §V2-8 AC16 (deep contextual commands), reinterpreted under
 * SPEC-V3: there are no idle units to dispatch; the "unit working a review/fix task" context
 * is reached by selecting a CARD whose attending agent works that task (cards in DO,
 * §V3-1: "Clicking a card selects it (SelectionPanel + contextual CommandCard as before)").
 *
 * FROZEN input for implementation.
 * tickUntil budgets in this file doubled per SPEC-V4 §V4-4 pacing (sanctioned; non-semantic).
 */
import { expect, test, type Page } from '@playwright/test';
import { tickUntil } from './helpers';
import {
  agentsOnCard,
  bootBoard,
  cardById,
  ensureBacklogCardOfKind,
  moveCardViaSim,
  SEL3,
  type TaskKind,
} from './helpers-v3';

/** Start a card of `kind` working in DO and select it once its worker has spawned. */
async function selectWorkingCardOfKind(page: Page, kind: TaskKind): Promise<string> {
  const taskId = await ensureBacklogCardOfKind(page, kind);
  await moveCardViaSim(page, taskId, 'do');
  const working = await tickUntil(page, async () => (await agentsOnCard(page, taskId).count()) > 0, {
    chunk: 5,
    maxChunks: 80,
  });
  expect(working, `a worker must spawn on the ${kind} card-${taskId} after it enters DO (§V3-2)`).toBe(true);
  await cardById(page, taskId).click();
  await expect(page.locator(SEL3.selectionPanel)).toBeVisible();
  return taskId;
}

async function visibleCommandLabels(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-testid^="cmd-"]'))
      .filter((el) => (el as HTMLElement).offsetParent !== null)
      .map((el) => (el.textContent ?? '').trim()),
  );
}

test('AC16: a card working a review task shows Approve Review and Request Changes in the command card', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });
  await selectWorkingCardOfKind(page, 'review');

  // AC16 / V2-2: review → Approve Review, Request Changes (layered above the working staples).
  const labels = await visibleCommandLabels(page);
  expect(
    labels.some((l) => /approve review/i.test(l)),
    `command card must offer "Approve Review" for a working review task (AC16); saw: ${JSON.stringify(labels)}`,
  ).toBe(true);
  expect(
    labels.some((l) => /request changes/i.test(l)),
    `command card must offer "Request Changes" for a working review task (AC16); saw: ${JSON.stringify(labels)}`,
  ).toBe(true);
  // V2-2: "never Abort" is dropped — Abort stays among the working staples.
  expect(
    labels.some((l) => /\babort\b/i.test(l)),
    `the Abort staple must never be dropped from a working selection (V2-2); saw: ${JSON.stringify(labels)}`,
  ).toBe(true);
});

test('AC16: a card working a fix task shows Run Tests and Root-Cause; every visible command cell contains an inline SVG icon', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });
  await selectWorkingCardOfKind(page, 'fix');

  // AC16 / V2-2: fix → Run Tests, Root-Cause.
  const labels = await visibleCommandLabels(page);
  expect(
    labels.some((l) => /run tests/i.test(l)),
    `command card must offer "Run Tests" for a working fix task (AC16); saw: ${JSON.stringify(labels)}`,
  ).toBe(true);
  expect(
    labels.some((l) => /root[- ]cause/i.test(l)),
    `command card must offer "Root-Cause" for a working fix task (AC16); saw: ${JSON.stringify(labels)}`,
  ).toBe(true);

  // AC16: "every visible command cell contains an inline SVG icon" (V2-2: microagent-generated,
  // distinct procedural path-only glyph per command id).
  const census = await page.evaluate(() => {
    const cells = Array.from(document.querySelectorAll('[data-testid^="cmd-"]')).filter(
      (el) => (el as HTMLElement).offsetParent !== null,
    );
    return {
      total: cells.length,
      withSvg: cells.filter((el) => el.querySelector('svg')).length,
      missing: cells
        .filter((el) => !el.querySelector('svg'))
        .map((el) => el.getAttribute('data-testid')),
    };
  });
  expect(census.total).toBeGreaterThan(0);
  // V2-9 / V3-7: ≤12 command specs.
  expect(census.total, '≤12 command specs (V2-9/V3-7)').toBeLessThanOrEqual(12);
  expect(
    census.withSvg,
    `every visible command cell must contain an inline SVG icon (AC16); missing: ${JSON.stringify(census.missing)}`,
  ).toBe(census.total);
});
