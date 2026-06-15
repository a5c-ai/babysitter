/** TEMP v4-r1 review-header probe. Run: node e2e/__shots__/probe-review-head.mjs */
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

const target = await page.evaluate(() => {
  const s = window.__commander.store.getState();
  return s.board.cardIds.find((id) => {
    const c = s.board.cards[id].view;
    return c.column === 'backlog' && c.parentId === null && c.childIds.length === 0;
  });
});
await page.evaluate((id) => window.__commander.sim.moveCard(id, 'do'), target);
for (let i = 0; i < 240; i++) {
  await tick(10);
  await page.evaluate(() => {
    const s = window.__commander.store.getState();
    for (const q of s.board.inquiries) window.__commander.sim.answerInquiry(q.hookRequestId, null);
  });
  const col = await page.evaluate((id) => window.__commander.store.getState().board.cards[id].view.column, target);
  if (col === 'human-review') break;
}
const col = await page.evaluate((id) => window.__commander.store.getState().board.cards[id].view.column, target);
console.log('column:', col);
if (col !== 'human-review') throw new Error('did not reach human-review');

await page.evaluate((id) => window.__commander.store.getState().openReview(id), target);
await page.waitForSelector('[data-testid="review-panel"]');
await page.waitForTimeout(150);
const head = await page.locator('.wr-review-head').boundingBox();
await page.screenshot({ path: path.join(outDir, 'v4-r1-after-08-review-header-short.png'), clip: { x: head.x, y: head.y, width: head.width, height: head.height + 8 } });
// measure title overflow with the normal title
const probe = await page.evaluate(() => {
  const t = document.querySelector('.wr-review-title');
  return { text: t.textContent, clientWidth: t.clientWidth, scrollWidth: t.scrollWidth, truncated: t.scrollWidth > t.clientWidth };
});
console.log('short title:', JSON.stringify(probe));
// long title
await page.evaluate((id) => window.__commander.sim.updateTask(id, { title: 'Recalibrate the ancient brass differential engine of the western annex cogitator array' }), target);
await page.waitForTimeout(150);
const probe2 = await page.evaluate(() => {
  const t = document.querySelector('.wr-review-title');
  return { clientWidth: t.clientWidth, scrollWidth: t.scrollWidth, truncated: t.scrollWidth > t.clientWidth };
});
console.log('long title:', JSON.stringify(probe2));
const head2 = await page.locator('.wr-review-head').boundingBox();
await page.screenshot({ path: path.join(outDir, 'v4-r1-after-08b-review-header-long.png'), clip: { x: head2.x, y: head2.y, width: head2.width, height: head2.height + 8 } });
await browser.close();
console.log('done');
