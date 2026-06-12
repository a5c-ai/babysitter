/**
 * v3-inquiries.spec.ts — SPEC-V3 §V3-6: AC32 (breakpoint inquiries — option palettes, §V3-5).
 *
 * FROZEN input for implementation. Setup uses the sim verb `moveCard` (real drag proven by
 * tickUntil budgets in this file doubled per SPEC-V4 §V4-4 pacing (sanctioned; non-semantic).
 * AC26); inquiries only fire from working agents, so several cards are started.
 */
import { expect, test } from '@playwright/test';
import { tickUntil } from './helpers';
import {
  bootBoard,
  firstInquiryWithOptions,
  moveCardViaSim,
  openInquiryAndChoose,
  SEL3,
  singleCardsIn,
  tickerTexts,
} from './helpers-v3';

test('AC32: an inquiry with ≥3 options appears in the chat dock; options carry SVG icon + caption; choosing one resolves it, logs the caption, and the sim branches', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  // Start work on all single backlog cards so working agents emit inquiries (§V3-5 sim variety:
  // strategy / fix-approach / dependency-version choices and classic tool approvals).
  const singles = await singleCardsIn(page, 'backlog');
  expect(singles.length).toBeGreaterThan(0);
  for (const c of singles) await moveCardViaSim(page, c.taskId, 'do');

  // AC32: "tickUntil an inquiry with ≥3 options appears in the chat dock".
  const appeared = await tickUntil(
    page,
    async () => (await firstInquiryWithOptions(page, 3)) !== null,
    { chunk: 10, maxChunks: 160 },
  );
  expect(
    appeared,
    'an inquiry bubble with ≥3 options must appear in chat-dock within 800 ticks (AC32/§V3-5: options are 2–5; the sim must roll ≥3 within budget)',
  ).toBe(true);
  await expect(page.locator(SEL3.chatDock)).toBeVisible();

  const info = (await firstInquiryWithOptions(page, 3))!;
  expect(info.questionText.length, 'inquiry bubble must show the question text (§V3-5)').toBeGreaterThan(0);

  // AC32: "each option button renders an inline SVG icon + caption" (§V3-5: icon ABOVE a short
  // caption, microagent-generated path-only glyphs).
  const optionCensus = await page.evaluate((hookRequestId: string) => {
    const opts = Array.from(
      document.querySelectorAll(`[data-testid^="inquiry-opt-${hookRequestId}-"]`),
    );
    return opts.map((o) => ({
      hasSvg: Boolean(o.querySelector('svg')),
      caption: (o.textContent ?? '').trim(),
    }));
  }, info.hookRequestId);
  expect(optionCensus.length).toBeGreaterThanOrEqual(3);
  for (const o of optionCensus) {
    expect(o.hasSvg, `every inquiry option must render an inline SVG icon (AC32); census: ${JSON.stringify(optionCensus)}`).toBe(true);
    expect(o.caption.length, 'every inquiry option must render a short caption (AC32)').toBeGreaterThan(0);
  }

  const tickerLenBefore = (await tickerTexts(page)).length;

  // AC32: "clicking one resolves the inquiry (bubble clears/archives)".
  const chosen = await openInquiryAndChoose(page, { minOptions: 3, pick: 0 });
  await expect(
    page.locator(`[data-testid="inquiry-${chosen.hookRequestId}"]`),
    'the inquiry bubble must clear/archive once an option is chosen (AC32)',
  ).toBeHidden();

  // AC32: "logs the caption to the ticker".
  const escaped = chosen.caption.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const captionLogged = await tickUntil(
    page,
    async () => {
      const texts = await tickerTexts(page);
      return texts.some((t) => new RegExp(escaped, 'i').test(t));
    },
    { chunk: 5, maxChunks: 80 },
  );
  expect(
    captionLogged,
    `the chosen caption "${chosen.caption}" must be logged to the ticker (AC32)`,
  ).toBe(true);

  // AC32: "a follow-up event names the chosen option's path" — §V3-5: the sim visibly branches,
  // different follow-up events per option. Expect a NEW ticker event (beyond the choice log)
  // referencing the chosen option's id or caption.
  const followUp = await tickUntil(
    page,
    async () => {
      const texts = await tickerTexts(page);
      const fresh = texts.slice(tickerLenBefore);
      const mentions = fresh.filter(
        (t) => new RegExp(escaped, 'i').test(t) || t.toLowerCase().includes(chosen.optionId.toLowerCase()),
      );
      return mentions.length >= 2; // the choice log itself + ≥1 branch follow-up
    },
    { chunk: 10, maxChunks: 160 },
  );
  expect(
    followUp,
    `a follow-up sim event naming the chosen option ("${chosen.optionId}" / "${chosen.caption}") must appear after resolution (AC32/§V3-5)`,
  ).toBe(true);
});
