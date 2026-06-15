/**
 * v2-process.spec.ts — SPEC-V2 §V2-8 AC20 (babysitter process-flow Inspector tab, V2-5).
 * Persists under V3 ("the babysitter process-flow inspector tab (V2-5, AC20)"); the working
 * unit is reached by starting a card in DO. Double-click opens the Inspector (§V3-1).
 *
 * FROZEN input for implementation.
 * tickUntil budgets in this file doubled per SPEC-V4 §V4-4 pacing (sanctioned; non-semantic).
 */
import { expect, test } from '@playwright/test';
import { tick, tickUntil } from './helpers';
import {
  agentsOnCard,
  bootBoard,
  cardById,
  firstInquiryWithOptions,
  moveCardViaSim,
  SEL3,
  singleCardsIn,
} from './helpers-v3';

test('AC20: Inspector Process tab — stage pipeline with exactly one current stage, a `waiting` run-state badge, a growing journal, and a breakpoint ×1 chip when an approval is pending', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  // Start exactly ONE card working so pending inquiries/breakpoints belong to its run.
  const singles = await singleCardsIn(page, 'backlog');
  expect(singles.length).toBeGreaterThan(0);
  const taskId = singles[0].taskId;
  await moveCardViaSim(page, taskId, 'do');
  const working = await tickUntil(page, async () => (await agentsOnCard(page, taskId).count()) > 0, {
    chunk: 5,
    maxChunks: 80,
  });
  expect(working, `a worker must spawn on card-${taskId} (§V3-2)`).toBe(true);
  await tick(page, 10); // let the run emit its first journal events

  // §V3-1: "double-click opens the Inspector".
  await cardById(page, taskId).dblclick();
  const inspector = page.locator(SEL3.inspector);
  await expect(inspector).toBeVisible();

  // V2-5: tabs Transcript (default) and Process.
  await expect(inspector.locator(SEL3.inspectorTabTranscript)).toBeVisible();
  await inspector.locator(SEL3.inspectorTabProcess).click();

  // AC20: "a stage pipeline with exactly one current stage" — V2-5: current = glowing amber
  // with gear spinner; done = filled; pending = etched outline. Exact chip markup is
  // unknowable; assert exactly one current-marked element inside the inspector body
  // (excluding the tab buttons themselves).
  const currentStages = await inspector.evaluate((root: Element) => {
    const marked = Array.from(
      root.querySelectorAll('[data-current="true"], [aria-current], [class*="stage-current"], [class*="current"]'),
    ).filter((el) => !(el.getAttribute('data-testid') ?? '').startsWith('inspector-tab-'));
    return marked.length;
  });
  expect(
    currentStages,
    'the Process tab stage pipeline must mark EXACTLY one current stage (AC20/V2-5)',
  ).toBe(1);

  // AC20: "an ObservedRunState badge reading `waiting`" (V2-5: ObservedRunState =
  // created|waiting|completed|halted|failed; a working run with pending effects is waiting).
  const inspectorText = (await inspector.innerText()).toLowerCase();
  expect(
    /\bwaiting\b/.test(inspectorText),
    `the ObservedRunState badge must read "waiting" for a working run (AC20); inspector text: ${inspectorText.slice(0, 400)}`,
  ).toBe(true);

  // AC20: "a journal list that grows over ticks" — V2-5: scrolling journal (seq, type, label,
  // clock time) newest-last. Assert the highest journal seq number visible in the tab grows.
  const journalSize = async (): Promise<number> =>
    inspector.evaluate((root: Element) => {
      const text = root.textContent ?? '';
      const types = text.match(/EFFECT_REQUESTED|EFFECT_RESOLVED|RUN_CREATED|RUN_COMPLETED|RUN_FAILED|RUN_HALTED|EFFECT_CANCELLED|PROCESS_RUNTIME_ERROR/g);
      return types ? types.length : 0;
    });
  const before = await journalSize();
  expect(before, 'the journal list must already show events for a working run (V2-5)').toBeGreaterThan(0);
  const grew = await tickUntil(page, async () => (await journalSize()) > before, {
    chunk: 10,
    maxChunks: 80,
  });
  expect(grew, `the journal list must grow over ticks (AC20); stuck at ${before} events`).toBe(true);

  // AC20: "when an approval is pending, `breakpoint ×1` chip appears" — V2-5: approval
  // hook.requests map to breakpoint effects; under V3 those are the §V3-5 inquiries.
  const inquiryPending = await tickUntil(
    page,
    async () => (await firstInquiryWithOptions(page, 2)) !== null,
    { chunk: 10, maxChunks: 160 },
  );
  expect(
    inquiryPending,
    'an inquiry/breakpoint must go pending for the only working run within 800 ticks (V2-5/V3-5)',
  ).toBe(true);
  await expect
    .poll(async () => (await inspector.innerText()).replace(/\s+/g, ' '), {
      message: 'a `breakpoint ×1` pendingEffectsByKind chip must appear while the inquiry is pending (AC20)',
    })
    .toMatch(/breakpoint\s*[×x]\s*1/i);
});
