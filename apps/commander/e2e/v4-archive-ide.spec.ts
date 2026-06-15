/**
 * v4-archive-ide.spec.ts — SPEC-V4 §V4-10: AC44 (archive graph navigation overhaul);
 * SPEC-V4 §V4-11: AC45 (web IDE light + Open in IDE + ghost completion).
 *
 * FROZEN input for implementation. Determinism: /?seed=42, pause-on-boot, sim.tick(n) only.
 * Zoom/pan are VIEW-ONLY (§V4-10) so geometry probes never touch sim state; the ghost idle
 * timer (~400ms, §V4-11) is UI-level and covered by Playwright expect-polling, not sim ticks.
 */
import { expect, test, type Page } from '@playwright/test';
import { tickUntil } from './helpers';
import {
  bootBoard,
  cardsInColumn,
  columnOfCard,
  moveCardViaSim,
  SEL3,
  singleCardsIn,
} from './helpers-v3';
import {
  emptyCanvasPoint,
  firstNodeCenter,
  nodePairDistance,
  SEL4,
  V4_BUDGET,
} from './helpers-v4';

test('AC44: archive graph — wheel zoom (clamped), drag pan, memory-search with match count, silo cluster captions, reset-view restores', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  // Open the Archive (M key, V2 §V2-3).
  await page.keyboard.press('m');
  const overlay = page.locator(SEL3.memoryOverlay);
  await expect(overlay).toBeVisible();
  await expect
    .poll(() => page.locator(SEL3.memoryNode).count(), {
      message: 'the Archive graph must render its memory-node-* elements (V2 AC17)',
    })
    .toBeGreaterThanOrEqual(30);

  const baselineDistance = await nodePairDistance(page);
  expect(baselineDistance, 'need ≥2 memory nodes for the zoom-scale probe').toBeGreaterThan(0);
  const baselineCenter = await firstNodeCenter(page);

  // ---- Wheel zoom changes scale (§V4-10) ----
  const canvasPoint = await emptyCanvasPoint(page);
  await page.mouse.move(canvasPoint.x, canvasPoint.y);
  await page.mouse.wheel(0, -240);
  await page.mouse.wheel(0, -240);
  await expect
    .poll(() => nodePairDistance(page), {
      message: 'wheel-up over the graph canvas must zoom IN (inter-node distance grows) (AC44/§V4-10)',
    })
    .toBeGreaterThan(baselineDistance * 1.05);

  // ---- Clamped: hammering the wheel stops changing the scale (§V4-10 "clamped") ----
  for (let i = 0; i < 40; i++) await page.mouse.wheel(0, -240);
  const atMax = await nodePairDistance(page);
  await page.mouse.wheel(0, -240);
  await page.mouse.wheel(0, -240);
  const afterMore = await nodePairDistance(page);
  expect(
    Math.abs(afterMore - atMax),
    `zoom must clamp at a max scale — further wheel-up must not change the view (AC44/§V4-10); ` +
      `distance ${atMax} -> ${afterMore}`,
  ).toBeLessThanOrEqual(1);

  // ---- Drag pan (§V4-10) ----
  const panStart = await emptyCanvasPoint(page);
  const nodeBeforePan = await firstNodeCenter(page);
  await page.mouse.move(panStart.x, panStart.y);
  await page.mouse.down();
  for (const f of [0.25, 0.5, 0.75, 1]) {
    await page.mouse.move(panStart.x + 90 * f, panStart.y + 50 * f, { steps: 3 });
  }
  await page.mouse.up();
  await expect
    .poll(async () => {
      const c = await firstNodeCenter(page);
      return Math.hypot(c.x - nodeBeforePan.x, c.y - nodeBeforePan.y);
    }, { message: 'dragging the graph canvas must PAN the view (nodes shift) (AC44/§V4-10)' })
    .toBeGreaterThan(20);

  // ---- Silo cluster captions on the canvas (§V4-10: "silo captions on the canvas") ----
  const siloNames = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-testid^="memory-silo-"]')).map((el) =>
      (el.getAttribute('data-testid') ?? '').slice('memory-silo-'.length).toLowerCase(),
    ),
  );
  expect(siloNames.length, '≥3 silo cards must exist (V2 AC17)').toBeGreaterThanOrEqual(3);
  const canvasText = await page.evaluate(() => {
    const node = document.querySelector('[data-testid^="memory-node-"]');
    const canvas = node?.closest('svg');
    return (canvas?.textContent ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  });
  const captioned = siloNames.filter((n) => canvasText.includes(n.replace(/[^a-z0-9]/g, '')));
  expect(
    captioned.length,
    `the graph canvas must render silo cluster captions (≥2 silo names as svg text) (AC44/§V4-10); ` +
      `silos: ${JSON.stringify(siloNames)}`,
  ).toBeGreaterThanOrEqual(2);

  // ---- Search box filters/highlights with match count (§V4-10) ----
  const queryToken = await page.evaluate(() => {
    const node = document.querySelector('[data-testid^="memory-node-"]');
    const id = (node?.getAttribute('data-testid') ?? '').slice('memory-node-'.length);
    // a mid-length fragment of the node id — guaranteed ≥1 match by construction
    return id.slice(0, Math.max(4, Math.floor(id.length / 2)));
  });
  const searchEl = page.locator(SEL4.memorySearch).first();
  await expect(searchEl, 'the Archive must gain a memory-search box (AC44/§V4-10)').toBeVisible();
  const searchInput = (await searchEl.evaluate((e: Element) => e.tagName.toLowerCase())) === 'input'
    ? searchEl
    : searchEl.locator('input').first();
  await searchInput.fill(queryToken);

  // match count visible…
  await expect(
    overlay.getByText(/\d+\s*match/i).first(),
    `searching "${queryToken}" must surface a numeric match count (AC44/§V4-10)`,
  ).toBeVisible();
  // …and a filtering/highlighting effect on the nodes.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const nodes = Array.from(document.querySelectorAll('[data-testid^="memory-node-"]'));
          const marked = nodes.filter((n) =>
            /\b(match|highlight|hit|dim(med)?|filtered)\b/i.test(n.getAttribute('class') ?? ''),
          ).length;
          const hidden = nodes.filter((n) => {
            const r = (n as HTMLElement | SVGElement).getBoundingClientRect();
            return r.width === 0 || r.height === 0;
          }).length;
          return marked + hidden;
        }),
      { message: 'the search must filter or highlight nodes (match/dim classes or hidden non-matches) (AC44/§V4-10)' },
    )
    .toBeGreaterThan(0);
  await searchInput.fill('');

  // ---- Reset view restores (§V4-10) ----
  await overlay.locator('button', { hasText: /reset/i }).first().click();
  await expect
    .poll(() => nodePairDistance(page), {
      message: 'reset-view must restore the original zoom (inter-node distance back to baseline) (AC44/§V4-10)',
    })
    .toBeLessThanOrEqual(baselineDistance + 2);
  const centerAfterReset = await firstNodeCenter(page);
  expect(
    Math.hypot(centerAfterReset.x - baselineCenter.x, centerAfterReset.y - baselineCenter.y),
    'reset-view must restore the original pan (AC44/§V4-10)',
  ).toBeLessThanOrEqual(4);
});

/** Drive at least one non-yolo card into HUMAN REVIEW and return its id. */
async function driveCardToHumanReview(page: Page): Promise<string> {
  const singles = await singleCardsIn(page, 'backlog');
  for (const c of singles) await moveCardViaSim(page, c.taskId, 'do');
  const ids = singles.map((c) => c.taskId);
  let inReview: string | null = null;
  const ok = await tickUntil(
    page,
    async () => {
      for (const id of ids) {
        if ((await columnOfCard(page, id)) === 'human-review') {
          inReview = id;
          return true;
        }
      }
      return false;
    },
    V4_BUDGET,
  );
  if (!ok || !inReview) {
    throw new Error(
      `no card reached HUMAN REVIEW within ${V4_BUDGET.chunk * V4_BUDGET.maxChunks} ticks ` +
        '(§V3-2 non-yolo PASS path; AC45 needs a review-panel card).',
    );
  }
  return inReview;
}

test('AC45: Open in IDE — explorer with changed-file badges, two highlighted tabs, ghost completion accepted with Tab, Esc cascade', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });
  const reviewId = await driveCardToHumanReview(page);

  // Review panel gains `Open in IDE` (§V4-11).
  await page.locator(`[data-testid="card-${reviewId}"]`).first().click();
  const reviewPanel = page.locator(SEL3.reviewPanel);
  await expect(reviewPanel).toBeVisible();
  await reviewPanel.locator(SEL4.reviewOpenIde).click();
  const ide = page.locator(SEL4.ideOverlay);
  await expect(ide, 'review-open-ide must open the ide-overlay full-screen plate (AC45/§V4-11)').toBeVisible();

  // Explorer shows the §V4-8 tree with changed-file A/M/D badges.
  const explorer = page.locator(SEL4.ideExplorer);
  await expect(explorer).toBeVisible();
  const fileEntryCount = await explorer.evaluate(
    (root: Element) => Array.from(root.querySelectorAll('*')).filter((el) => /\.[a-z]+$/i.test((el.textContent ?? '').trim()) && el.children.length <= 3).length,
  );
  expect(fileEntryCount, 'the explorer must list workspace files (8–20 per §V4-8)').toBeGreaterThanOrEqual(2);
  const badged = await explorer.evaluate((root: Element) =>
    Array.from(root.querySelectorAll('*')).filter((el) => {
      const t = (el.textContent ?? '').trim();
      return /^[AMD]$/.test(t) || /\b(badge|status)-(a|m|d|added|modified|deleted)\b/i.test(el.getAttribute('class') ?? '');
    }).length,
  );
  expect(
    badged,
    'changed files must carry A/M/D badges in the explorer (AC45/§V4-11)',
  ).toBeGreaterThanOrEqual(1);

  // Opening two files yields two tabs with token-span syntax highlighting. Explorer entry
  // markup is unknowable — mark the two innermost distinct highlightable-file entries.
  const markedFiles = await explorer.evaluate((root: Element) => {
    const entries = Array.from(root.querySelectorAll('*')).filter((el) => {
      const t = (el.textContent ?? '').trim();
      return el.children.length <= 3 && t.length <= 60 && /\.(ts|tsx|js|json|css|md)\b/i.test(t);
    });
    // innermost only: drop entries that contain another entry
    const leaves = entries.filter((el) => !entries.some((other) => other !== el && el.contains(other)));
    const seen = new Set<string>();
    const picked: string[] = [];
    for (const el of leaves) {
      const name = (el.textContent ?? '').trim();
      if (seen.has(name)) continue;
      seen.add(name);
      el.setAttribute('data-e2e-file', String(picked.length));
      picked.push(name);
      if (picked.length === 2) break;
    }
    return picked;
  });
  expect(
    markedFiles.length,
    'the explorer must offer ≥2 distinct highlightable files (ts/tsx/js/json/css/md, §V4-8/§V4-11)',
  ).toBe(2);
  await explorer.locator('[data-e2e-file="0"]').click();
  await expect
    .poll(() => page.locator(SEL4.ideTab).count(), {
      message: 'opening a file must add an ide-tab-* editor tab (AC45/§V4-11)',
    })
    .toBeGreaterThanOrEqual(1);
  await explorer.locator('[data-e2e-file="1"]').click();
  await expect
    .poll(() => page.locator(SEL4.ideTab).count(), {
      message: 'opening two files must yield two ide-tab-* tabs (AC45/§V4-11)',
    })
    .toBeGreaterThanOrEqual(2);

  // Token-span highlighting (§V4-11: regex tokenizer to CSS token spans).
  const tokenSpans = await ide.evaluate(
    (root: Element) =>
      root.querySelectorAll(
        'span[class*="tok"], span[class*="keyword"], span[class*="string"], span[class*="comment"], span[class*="number"], span[class*="type"]',
      ).length,
  );
  expect(
    tokenSpans,
    'the editor must render token spans (comments/strings/keywords/numbers/types) (AC45/§V4-11)',
  ).toBeGreaterThanOrEqual(3);

  // ---- Ghost completion (§V4-11) ----
  const buffer = ide.locator('textarea').first();
  await expect(
    buffer,
    'the editable buffer is a (transparent) textarea over the highlight layer (§V4-11)',
  ).toBeVisible();
  await buffer.click();
  await buffer.press('Control+End'); // caret to end of buffer = at a line end
  await buffer.pressSequentially('const aether', { delay: 20 });
  const ghost = page.locator(SEL4.ideGhost);
  // ~400ms idle is UI-level; expect-polling covers it.
  await expect(
    ghost,
    'after ~400ms idle at line end the mock microagent must render inline ghost text (AC45/§V4-11 suggestCompletion)',
  ).toBeVisible({ timeout: 5_000 });
  const ghostText = ((await ghost.innerText()) ?? '').trim();
  expect(ghostText.length, 'ghost suggestion must be non-empty (§V4-11)').toBeGreaterThan(0);

  // Tab accepts: the buffer now contains the suggestion.
  await buffer.press('Tab');
  await expect
    .poll(async () => ((await buffer.inputValue()) ?? '').includes(ghostText), {
      message: `pressing Tab must accept the ghost suggestion into the buffer ("${ghostText}") (AC45/§V4-11)`,
    })
    .toBe(true);

  // Dirty dot appears on the edited tab (§V4-11 "close buttons, dirty dot").
  const dirtySeen = await ide.evaluate((root: Element) =>
    Array.from(root.querySelectorAll('[data-testid^="ide-tab-"]')).some(
      (tab) =>
        /\b(dirty|modified|unsaved)\b/i.test(tab.getAttribute('class') ?? '') ||
        tab.querySelector('[class*="dirty"], [class*="dot"], [class*="unsaved"]') !== null ||
        /[●•]/.test(tab.textContent ?? ''),
    ),
  );
  expect(dirtySeen, 'the edited file tab must show a dirty dot (AC45/§V4-11)').toBe(true);

  // ---- Esc cascade: IDE sits at the top — first Esc closes the IDE, the review panel stays ----
  await page.keyboard.press('Escape');
  await expect(ide, 'Esc must close the ide-overlay (top of the cascade, §V4-11)').toBeHidden();
  await expect(
    reviewPanel,
    'the review panel must survive the IDE Esc (cascade order: ide > review panel, §V4-11/§V3-7)',
  ).toBeVisible();
  // The card never moved — IDE edits are session-local (§V4-11 writeFile is view-state).
  await expect(
    cardsInColumn(page, 'human-review').locator(`[data-testid="card-${reviewId}"]`),
  ).toHaveCount(1);
});
