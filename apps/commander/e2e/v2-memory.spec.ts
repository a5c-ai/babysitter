/**
 * v2-memory.spec.ts — SPEC-V2 §V2-8 AC17 + AC18 (the Company Brain / Archive overlay, V2-3).
 * Unchanged by V3 ("the memory system + Archive overlay (V2-3, AC17/AC18)" persists), except
 * that "working units" are now the agents attending DO cards, so AC18 starts a card first.
 *
 * FROZEN input for implementation.
 * tickUntil budgets in this file doubled per SPEC-V4 §V4-4 pacing (sanctioned; non-semantic).
 */
import { expect, test } from '@playwright/test';
import { tickUntil } from './helpers';
import {
  bootBoard,
  cardById,
  moveCardViaSim,
  SEL3,
  singleCardsIn,
  tickerTexts,
  tickUntilTickerMatches,
} from './helpers-v3';

test('AC17: Archive overlay — M opens memory-overlay with ≥3 silo cards and ≥30 nodes; a kind filter narrows; clicking a node shows its attributes card', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  // AC17: "`M` (and topbar-memory) opens `memory-overlay`" — verify both entry points.
  await page.locator('[data-testid="topbar-memory"]').click();
  const overlay = page.locator(SEL3.memoryOverlay);
  await expect(overlay).toBeVisible();
  await page.keyboard.press('Escape'); // V2-3 Esc cascade: archive closes first.
  await expect(overlay).toBeHidden();
  await page.keyboard.press('m');
  await expect(overlay).toBeVisible();

  // AC17: "≥3 silo cards and ≥30 memory-node-* elements" (V2-3 sim: 40–60 records, 3–4 silos).
  await expect
    .poll(() => page.locator(SEL3.memorySilo).count(), {
      message: 'overlay must show ≥3 silo cards (AC17, memory-silo-<name>)',
    })
    .toBeGreaterThanOrEqual(3);
  await expect
    .poll(() => page.locator(SEL3.memoryNode).count(), {
      message: 'overlay must show ≥30 memory-node-* elements (AC17)',
    })
    .toBeGreaterThanOrEqual(30);

  // AC17: "a nodeKind filter chip narrows visible nodes" (V2-3: memory-filter-<kind>).
  const visibleNodes = async () =>
    page.evaluate(
      () =>
        Array.from(document.querySelectorAll('[data-testid^="memory-node-"]')).filter(
          (el) => (el as HTMLElement).offsetParent !== null || el instanceof SVGElement
        ).filter((el) => {
          const r = (el as Element).getBoundingClientRect();
          return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
            && getComputedStyle(el).display !== 'none';
        }).length,
    );
  const before = await visibleNodes();
  const filter = page.locator('[data-testid^="memory-filter-"]').first();
  await expect(filter, 'nodeKind filter chips must exist (V2-3, memory-filter-<kind>)').toBeVisible();
  await filter.click();
  await expect
    .poll(visibleNodes, { message: 'applying a nodeKind filter must narrow the visible nodes (AC17)' })
    .toBeLessThan(before);
  await filter.click(); // restore for the node-click assertion

  // AC17: "clicking a node shows its attributes card (title + status + owners)" — V2-3 graph
  // record attributes { title, status: draft|approved|deprecated|archived, owners[] }.
  await page.locator(SEL3.memoryNode).first().click();
  const overlayText = (await overlay.innerText()).toLowerCase();
  expect(
    /\b(draft|approved|deprecated|archived)\b/.test(overlayText),
    'the attributes card must show the record status (one of draft/approved/deprecated/archived; AC17)',
  ).toBe(true);
  expect(
    /owner/.test(overlayText),
    'the attributes card must show the record owners (AC17)',
  ).toBe(true);
});

test('AC18: memory transfer — a memory_query event yields a ticker entry, a transfer pulse in the open overlay, and a growing held-pieces highlight for the requesting card', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  // V3 reinterpretation: working units are agents on DO cards — start one card working.
  const singles = await singleCardsIn(page, 'backlog');
  expect(singles.length).toBeGreaterThan(0);
  const taskId = singles[0].taskId;
  await moveCardViaSim(page, taskId, 'do');

  // Select the working card so the overlay highlights the pieces its agent holds (V2-3:
  // "selecting a unit (before opening …) highlights pieces it holds and dims the rest").
  await cardById(page, taskId).click();

  // Open the Archive, then tick until a memory_query fires (V2-3: run.event-enveloped
  // sim-local payloads, deterministic per seed).
  await page.keyboard.press('m');
  const overlay = page.locator(SEL3.memoryOverlay);
  await expect(overlay).toBeVisible();

  const heldHighlights = async (): Promise<number> =>
    overlay.evaluate(
      (root: Element) =>
        root.querySelectorAll('[class*="held"], [class*="highlight"], [data-held="true"], [data-highlighted="true"]')
          .length,
    );
  const heldBefore = await heldHighlights();

  // AC18: "ticking until a memory_query event fires yields a ticker entry".
  await tickUntilTickerMatches(page, /memory[\s_-]?quer/i, {
    label: 'a memory_query ticker entry (AC18)',
    chunk: 10,
    maxChunks: 160,
  });

  // AC18: "with the overlay open, a transfer pulse element" — V2-3: "live transfer events
  // animate a pulse along the silo→graph-node path". Exact markup unknowable; accept a
  // pulse-marked element inside the overlay.
  const pulseSeen = await tickUntil(
    page,
    async () =>
      (await overlay.evaluate(
        (root: Element) =>
          root.querySelectorAll('[data-testid*="pulse"], [class*="pulse"], [data-transfer]').length,
      )) > 0,
    { chunk: 5, maxChunks: 80 },
  );
  expect(
    pulseSeen,
    'a transfer pulse element must animate inside the open overlay when a memory_query fires (AC18/V2-3)',
  ).toBe(true);

  // AC18: "the requesting unit's held-pieces highlight count increases" — matched records
  // enter the agent's held-pieces set (V2-3 sim).
  const heldGrew = await tickUntil(page, async () => (await heldHighlights()) > heldBefore, {
    chunk: 10,
    maxChunks: 160,
  });
  expect(
    heldGrew,
    `the selected card's held-pieces highlight count must increase after memory queries (AC18); was ${heldBefore}. Ticker tail: ${JSON.stringify((await tickerTexts(page)).slice(-10))}`,
  ).toBe(true);
});
