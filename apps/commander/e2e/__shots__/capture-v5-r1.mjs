/**
 * TEMP v5-r1 self-check capture (not a test). Run: node e2e/__shots__/capture-v5-r1.mjs
 * Surfaces, one per finding:
 *   (1) registry session detail — transcript ink on parchment (+ inspector transcript)
 *   (2) review panel header — long title wrap + compressed chips; (7) middle region files+diff
 *   (3) registry stacks tab — caption-aligned grid columns
 *   (4) registry task detail — etched attempt-group role chips
 *   (5) registry session detail — single parent link (sub-header only)
 *   (6) archive corner deep-zoom — dead-space focal bias toward nearest cluster
 *   (8) inspector sessions rows — two-line chips, even heights
 */
import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('pageerror', (e) => console.error('PAGEERROR:', e.message));

await page.addInitScript(() => {
  const iv = setInterval(() => {
    if (window.__commander?.sim?.pause) {
      try { window.__commander.sim.pause(); } catch { /* ignore */ }
      clearInterval(iv);
    }
  }, 5);
  setTimeout(() => clearInterval(iv), 30_000);
});

await page.goto('http://localhost:5199/?seed=42');
await page.waitForFunction(() => Boolean(window.__commander));
await page.waitForSelector('[data-testid="kanban-board"]');

const tick = (n) => page.evaluate((c) => window.__commander.sim.tick(c), n);
const shot = (name, clip) =>
  page.screenshot({ path: path.join(outDir, `v5-r1-after-${name}.png`), ...(clip ? { clip } : {}) });

// ---- stage: drive backlog singles (non-yolo) so human-review + sessions exist ----
const singles = await page.evaluate(() => {
  const s = window.__commander.store.getState();
  return s.board.cardIds.filter((id) => {
    const c = s.board.cards[id].view;
    return c.column === 'backlog' && c.parentId === null && c.childIds.length === 0;
  });
});
await page.evaluate((ids) => {
  for (const id of ids) window.__commander.sim.moveCard(id, 'do');
}, singles);
let reviewCard = null;
for (let i = 0; i < 400 && reviewCard === null; i++) {
  await tick(10);
  await page.evaluate(() => {
    const s = window.__commander.store.getState();
    for (const q of s.board.inquiries) window.__commander.sim.answerInquiry(q.hookRequestId, null);
  });
  reviewCard = await page.evaluate(() => {
    const s = window.__commander.store.getState();
    return (
      s.board.cardIds.find((id) => s.board.cards[id].view.column === 'human-review') ?? null
    );
  });
}
console.log('human-review card:', reviewCard);

// ---- (2)/(7) review panel: long title wrap + middle-region files/diff ----------
if (reviewCard !== null) {
  await page.locator(`[data-testid="card-${reviewCard}"]`).click();
  await page.waitForSelector('[data-testid="review-panel"]');
  await page.waitForTimeout(200);
  await shot('review-panel-normal');
  // open the first diff plate (middle region check)
  await page.locator('[data-testid="ws-file-0"]').click();
  await page.waitForTimeout(150);
  await shot('review-panel-diff-open');
  // DOM-only long-title probe (view layer; sim untouched)
  await page.evaluate(() => {
    const el = document.querySelector('.wr-review-title');
    if (el) el.textContent =
      'Refactor the deterministic replay cursor and harden the journal repair rites of the cogitator';
  });
  await page.waitForTimeout(100);
  await shot('review-panel-long-title', { x: 1100, y: 40, width: 500, height: 400 });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
}

// ---- (8) inspector sessions rows: two-line chips, even heights -----------------
const reviewedCard = await page.evaluate(() => {
  const sessions = window.__commander.sim.listSessions();
  const reviewer = sessions.find((s) => s.reviewOfSessionId !== null);
  return reviewer?.taskId ?? null;
});
console.log('sessions tab card:', reviewedCard);
if (reviewedCard !== null) {
  await page.evaluate((id) => window.__commander.store.getState().openInspectorSessions(id), reviewedCard);
  await page.waitForSelector('[data-testid="inspector-tab-sessions"]');
  await page.waitForTimeout(200);
  await shot('sessions-rows');
  // (1) inspector transcript ink (dark ground — must stay legible too)
  const row = page.locator('[data-testid^="session-row-"]').first();
  await row.click();
  await page.waitForSelector('[data-testid="session-transcript"]');
  await page.waitForTimeout(150);
  await shot('inspector-session-transcript');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
}

// ---- (3) registry stacks grid ---------------------------------------------------
await page.evaluate(() => window.__commander.store.getState().openRegistry());
await page.waitForSelector('[data-testid="registry-overlay"]');
await page.waitForTimeout(150);
await shot('registry-stacks-grid');

// ---- (1)/(5) registry session detail: transcript ink + single parent chip -------
await page.locator('[data-testid="registry-tab-agents"]').click();
await page.waitForTimeout(150);
const detailSession = await page.evaluate(() => {
  const sessions = window.__commander.sim.listSessions();
  // prefer a session WITH a parent (checks the de-duplicated parent chip)
  const withParent =
    sessions.find((s) => s.parentSessionId !== null && s.status === 'completed') ??
    sessions.find((s) => s.status === 'completed') ??
    sessions[0];
  return withParent?.sessionId ?? null;
});
console.log('registry session detail:', detailSession);
await page.locator(`[data-testid="registry-row-${detailSession}"]`).click();
await page.waitForSelector('[data-testid="registry-agent-detail"]');
await page.waitForTimeout(150);
const parentChipCount = await page.evaluate(() => {
  const overlay = document.querySelector('[data-testid="registry-overlay"]');
  return Array.from(overlay.querySelectorAll('button')).filter((b) =>
    (b.textContent ?? '').trim().startsWith('parent ⟶'),
  ).length;
});
console.log('parent link chips in registry session detail:', parentChipCount);
await shot('registry-session-detail');
await page.keyboard.press('Escape');
await page.waitForTimeout(200);

// ---- (4) registry task detail: etched attempt-group role chips ------------------
await page.evaluate(() => window.__commander.store.getState().openRegistry());
await page.waitForSelector('[data-testid="registry-overlay"]');
await page.locator('[data-testid="registry-tab-tasks"]').click();
await page.waitForTimeout(150);
const workedTask = await page.evaluate(() => {
  const sessions = window.__commander.sim.listSessions();
  return sessions[0]?.taskId ?? null;
});
console.log('registry task detail:', workedTask);
await page.locator(`[data-testid="registry-row-${workedTask}"]`).click();
await page.waitForSelector('[data-testid="registry-task-detail"]');
await page.waitForTimeout(150);
await shot('registry-task-detail');
await page.keyboard.press('Escape');
await page.waitForTimeout(200);

// ---- (6) archive deep zoom from dead space ---------------------------------------
await page.evaluate(() => window.__commander.store.getState().openArchive());
await page.waitForSelector('[data-testid="memory-overlay"]');
const svgBox = await page.locator('[data-testid="memory-overlay"] svg').last().boundingBox();
// wheel-zoom hard with the cursor in the dead CENTER-GUTTER / corner dead space
await page.mouse.move(svgBox.x + svgBox.width - 40, svgBox.y + svgBox.height - 40);
for (let i = 0; i < 14; i++) await page.mouse.wheel(0, -240);
await page.waitForTimeout(250);
await shot('archive-corner-deep-zoom');
// reset, then zoom from the plate CENTER dead space
await page.keyboard.press('Escape');
await page.waitForTimeout(150);
await page.evaluate(() => window.__commander.store.getState().openArchive());
await page.waitForSelector('[data-testid="memory-overlay"]');
const box2 = await page.locator('[data-testid="memory-overlay"] svg').last().boundingBox();
await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2);
for (let i = 0; i < 14; i++) await page.mouse.wheel(0, -240);
await page.waitForTimeout(250);
await shot('archive-center-deep-zoom');

await browser.close();
console.log('capture complete');
