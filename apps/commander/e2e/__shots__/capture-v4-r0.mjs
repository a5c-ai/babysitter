/**
 * TEMP v4-r0 self-check capture (not a test; .mjs so vitest/playwright ignore it).
 * Boots /?seed=42 at 1600x900 and stages the seven review states from the
 * v4-r0 punch list. Run from apps/commander: node e2e/__shots__/capture-v4-r0.mjs
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
const shot = (name) => page.screenshot({ path: path.join(outDir, `v4-r0-after-${name}.png`) });

// ---- 7. empty release rail at boot (lever visible, lanes etched) ----------
await shot('07-empty-release-rail');

// ---- stage work: move all backlog singles to DO ----------------------------
const singles = await page.evaluate(() => {
  const s = window.__commander.store.getState();
  return s.board.cardIds.filter((id) => {
    const c = s.board.cards[id].view;
    return c.column === 'backlog' && c.parentId === null && c.childIds.length === 0;
  });
});
for (const id of singles) {
  await page.evaluate((taskId) => window.__commander.sim.moveCard(taskId, 'do'), id);
}

// answer inquiries while ticking so the flow never deadlocks visibly
const answerAll = () =>
  page.evaluate(() => {
    const s = window.__commander.store.getState();
    for (const q of s.board.inquiries) window.__commander.sim.answerInquiry(q.hookRequestId, null);
  });

// tick until a card reaches human-review
let reviewId = null;
for (let i = 0; i < 200 && reviewId === null; i++) {
  await tick(10);
  await answerAll();
  reviewId = await page.evaluate(() => {
    const s = window.__commander.store.getState();
    return (
      s.board.cardIds.find((id) => s.board.cards[id].view.column === 'human-review') ?? null
    );
  });
}
if (!reviewId) throw new Error('no card reached human-review');
console.log('review card:', reviewId);

// ---- 1. runs ledger --------------------------------------------------------
await page.click('[data-testid="topbar-runs"]');
await page.waitForSelector('[data-testid="runs-overlay"]');
await shot('01-runs-ledger');

// run detail (journal fills height)
await page.locator('.wr-runs-row:not(.wr-runs-colhead)').first().click();
await page.waitForSelector('[data-testid="run-detail"]');
await shot('01b-run-detail');

// ---- 5. process editor ----------------------------------------------------
await page.click('[data-testid="process-library"]');
await page.locator('.wr-process-card').first().click();
await page.waitForSelector('[data-testid="process-editor"]');
await shot('05-process-editor');
await page.keyboard.press('Escape'); // close runs overlay

// ---- 2. archive zoomed with search ----------------------------------------
await page.keyboard.press('m');
await page.waitForSelector('[data-testid="memory-overlay"]');
const svgBox = await page.locator('.wr-memory-graph').boundingBox();
await page.mouse.move(svgBox.x + svgBox.width / 2, svgBox.y + svgBox.height / 2);
for (let i = 0; i < 6; i++) await page.mouse.wheel(0, -240);
await page.fill('[data-testid="memory-search"]', 'doc');
await page.waitForTimeout(150);
await shot('02-archive-zoom-search');
await page.evaluate(() => window.__commander.store.getState().closeArchive());
await page.waitForTimeout(80);

// ---- 3. review panel → terminal flow ---------------------------------------
await page.locator(`[data-testid="card-${reviewId}"]`).first().click();
await page.waitForSelector('[data-testid="review-panel"]');
await shot('03a-review-panel');
// Terminal intent on the same card: review panel must close, inspector opens
await page.evaluate((taskId) => {
  const s = window.__commander.store.getState();
  s.openInspectorCard(taskId);
  window.__commander.store.getState().setInspectorTab('terminal');
}, reviewId);
await page.waitForSelector('[data-testid="inspector-tab-terminal"]');
await page.waitForTimeout(120);
const reviewStillOpen = await page.locator('[data-testid="review-panel"]').count();
console.log('review panel open after terminal intent (want 0):', reviewStillOpen);
await shot('03b-terminal-after-review');
await page.keyboard.press('Escape'); // close inspector

// ---- 4. card editor ---------------------------------------------------------
await page.evaluate((taskId) => window.__commander.store.getState().openCardEditor(taskId), reviewId);
await page.waitForSelector('[data-testid="card-editor"]');
await shot('04-card-editor');
await page.keyboard.press('Escape');

// ---- 6. IDE with a .ts file open -------------------------------------------
await page.evaluate((taskId) => window.__commander.store.getState().openIde(taskId), reviewId);
await page.waitForSelector('[data-testid="ide-overlay"]');
await page.waitForTimeout(200);
const activeTab = await page.evaluate(() =>
  Array.from(document.querySelectorAll('[data-testid^="ide-tab-"]'))
    .filter((t) => t.getAttribute('aria-selected') === 'true')
    .map((t) => t.textContent),
);
console.log('ide active tab (want a .ts):', activeTab);
await shot('06-ide-ts-open');

// ---- diff plate fade (review panel diff open) --------------------------------
await page.keyboard.press('Escape'); // ide closes, review panel underneath survived earlier flow? reopen
await page.locator(`[data-testid="card-${reviewId}"]`).first().click();
await page.waitForSelector('[data-testid="review-panel"]');
await page.locator('[data-testid="ws-file-0"]').click();
await page.waitForTimeout(120);
await shot('08-diff-plate-fade');

await browser.close();
console.log('done');
