/**
 * TEMP v4-r1 self-check capture (not a test). Run: node e2e/__shots__/capture-v4-r1.mjs
 * Stages: release train MID-FLIGHT, card editor, archive (focused edges +
 * watermark + search), process editor chips, foundry stacks, orders sockets.
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
const shot = (name, clip) => page.screenshot({ path: path.join(outDir, `v4-r1-after-${name}.png`), ...(clip ? { clip } : {}) });

// ---- orders sockets at boot ------------------------------------------------
await shot('01-boot-orders-sockets');

// ---- stage: yolo backlog singles into the pipeline --------------------------
await page.evaluate(() => {
  const s = window.__commander.store.getState();
  for (const id of s.board.cardIds) {
    const c = s.board.cards[id].view;
    if (c.column === 'backlog' && c.parentId === null && c.childIds.length === 0) {
      window.__commander.sim.setYolo(id, true);
      window.__commander.sim.moveCard(id, 'do');
    }
  }
});
let merged = [];
for (let i = 0; i < 320 && merged.length < 3; i++) {
  await tick(10);
  await page.evaluate(() => {
    const s = window.__commander.store.getState();
    for (const q of s.board.inquiries) window.__commander.sim.answerInquiry(q.hookRequestId, null);
  });
  merged = await page.evaluate(() => {
    const s = window.__commander.store.getState();
    return s.board.cardIds.filter((id) => s.board.cards[id].view.column === 'merged');
  });
}
console.log('merged cards:', merged);

// merged rows at rest (full ink, item 5)
await page.waitForTimeout(900);
await shot('02-merged-rows-at-rest', { x: 0, y: 420, width: 700, height: 290 });

// ---- release train MID-FLIGHT ----------------------------------------------
await page.evaluate(() => window.__commander.sim.release());
await page.waitForTimeout(220);
await shot('03-release-train-midflight', { x: 0, y: 400, width: 760, height: 320 });
await page.waitForTimeout(2200);
await shot('03b-release-train-settled', { x: 0, y: 400, width: 760, height: 320 });

// ---- card editor -------------------------------------------------------------
const anyCard = await page.evaluate(() => {
  const s = window.__commander.store.getState();
  return s.board.cardIds.find((id) => !s.board.cards[id].view.merged) ?? s.board.cardIds[0];
});
await page.evaluate((id) => window.__commander.store.getState().openCardEditor(id), anyCard);
await page.waitForSelector('[data-testid="card-editor"]');
await shot('04-card-editor');
await page.keyboard.press('Escape');

// ---- archive: focused node edges + watermark + search ------------------------
await page.keyboard.press('m');
await page.waitForSelector('[data-testid="memory-overlay"]');
await page.waitForTimeout(150);
await shot('05-archive-overview');
// focus a well-connected node
await page.evaluate(() => {
  const nodes = document.querySelectorAll('[data-testid^="memory-node-"]');
  if (nodes.length > 4) nodes[4].dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await page.waitForTimeout(200);
await shot('05b-archive-focused-edges');
await page.fill('[data-testid="memory-search"]', 'doc');
await page.waitForTimeout(150);
await shot('05c-archive-search');
await page.evaluate(() => window.__commander.store.getState().closeArchive());
await page.waitForTimeout(80);

// ---- runs overlay → process editor chips -------------------------------------
await page.click('[data-testid="topbar-runs"]');
await page.waitForSelector('[data-testid="runs-overlay"]');
await page.click('[data-testid="process-library"]');
await page.locator('.wr-process-card').first().click();
await page.waitForSelector('[data-testid="process-editor"]');
await shot('06-process-editor-chips');
await page.keyboard.press('Escape');

// ---- foundry stacks (Forge From chip) ----------------------------------------
await page.keyboard.press('n');
await page.waitForSelector('[data-testid="foundry-stacks"]', { state: 'attached' });
await page.click('[data-testid="foundry-stacks"]');
await page.waitForTimeout(150);
await shot('07-foundry-stacks');
await page.keyboard.press('Escape');

// ---- review panel header (long title check) -----------------------------------
// drive a fresh card to human-review (yolo off)
const fresh = await page.evaluate(() => {
  const s = window.__commander.store.getState();
  return s.board.cardIds.find((id) => {
    const c = s.board.cards[id].view;
    return c.column === 'backlog' && c.parentId === null && c.childIds.length === 0;
  }) ?? null;
});
let reviewShot = false;
if (fresh) {
  await page.evaluate((id) => window.__commander.sim.moveCard(id, 'do'), fresh);
  for (let i = 0; i < 240; i++) {
    await tick(10);
    await page.evaluate(() => {
      const s = window.__commander.store.getState();
      for (const q of s.board.inquiries) window.__commander.sim.answerInquiry(q.hookRequestId, null);
    });
    const col = await page.evaluate((id) => window.__commander.store.getState().board.cards[id].view.column, fresh);
    if (col === 'human-review') break;
  }
  const col = await page.evaluate((id) => window.__commander.store.getState().board.cards[id].view.column, fresh);
  if (col === 'human-review') {
    await page.evaluate((id) => window.__commander.store.getState().openReview(id), fresh);
    await page.waitForSelector('[data-testid="review-panel"]');
    await page.waitForTimeout(150);
    await shot('08-review-panel-header');
    reviewShot = true;
  }
}
console.log('review shot:', reviewShot);
await browser.close();
console.log('done');
