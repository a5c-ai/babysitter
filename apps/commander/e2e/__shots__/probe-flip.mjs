/** TEMP FLIP-bug probe (v4-r1). Run: node e2e/__shots__/probe-flip.mjs */
import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('pageerror', (e) => console.error('PAGEERROR:', e.message));
page.on('console', (m) => {
  if (m.text().startsWith('[probe]')) console.log(m.text());
});

await page.addInitScript(() => {
  const iv = setInterval(() => {
    if (window.__commander?.sim?.pause) {
      try { window.__commander.sim.pause(); } catch { /* ignore */ }
      clearInterval(iv);
    }
  }, 5);
  setTimeout(() => clearInterval(iv), 30_000);
  // Instrument WAAPI to log every FLIP launch.
  const orig = Element.prototype.animate;
  Element.prototype.animate = function (...args) {
    const testid = this.getAttribute?.('data-testid') ?? '(no testid)';
    const rect = this.getBoundingClientRect();
    console.log(
      '[probe] animate',
      testid,
      'rect=', JSON.stringify({ x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) }),
      'kf0=', JSON.stringify(args[0]?.[0] ?? null),
    );
    return orig.apply(this, args);
  };
});

await page.goto('http://localhost:5199/?seed=42');
await page.waitForFunction(() => Boolean(window.__commander));
await page.waitForSelector('[data-testid="kanban-board"]');

const tick = (n) => page.evaluate((c) => window.__commander.sim.tick(c), n);

// stage: yolo all backlog singles, move to do
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

// tick until >=3 merged
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
if (merged.length < 3) throw new Error('could not stage 3 merged cards');

// let pending move animations settle
await page.waitForTimeout(900);
console.log('--- RELEASE ---');
await page.evaluate(() => window.__commander.sim.release());
await page.waitForTimeout(280);
await page.screenshot({ path: path.join(outDir, 'v4-r1-probe-flip-midflight.png') });
// sample live positions of the released cards mid-flight
const live = await page.evaluate((ids) => {
  return ids.map((id) => {
    const el = document.querySelector(`[data-testid="card-${id}"]`);
    if (!el) return { id, missing: true };
    const r = el.getBoundingClientRect();
    return { id, x: Math.round(r.x), y: Math.round(r.y), cls: el.className, anims: el.getAnimations().length };
  });
}, merged);
console.log('mid-flight:', JSON.stringify(live, null, 1));
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(outDir, 'v4-r1-probe-flip-settled.png') });
await browser.close();
console.log('done');
