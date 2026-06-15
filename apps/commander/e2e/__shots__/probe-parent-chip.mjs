/** TEMP v5-r1 probe: registry session detail must show the parent link ONCE (sub-header only). */
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

await page.evaluate(() => {
  const s = window.__commander.store.getState();
  for (const id of s.board.cardIds) {
    const c = s.board.cards[id].view;
    if (c.column === 'backlog' && c.parentId === null) {
      window.__commander.sim.setYolo(id, true);
      window.__commander.sim.moveCard(id, 'do');
    }
  }
});
let withParent = null;
for (let i = 0; i < 400 && withParent === null; i++) {
  await tick(10);
  await page.evaluate(() => {
    const s = window.__commander.store.getState();
    for (const q of s.board.inquiries) window.__commander.sim.answerInquiry(q.hookRequestId, null);
  });
  withParent = await page.evaluate(() => {
    const sessions = window.__commander.sim.listSessions();
    return sessions.find((s) => s.parentSessionId !== null)?.sessionId ?? null;
  });
}
console.log('session with parent:', withParent);
await page.evaluate(() => window.__commander.store.getState().openRegistry());
await page.waitForSelector('[data-testid="registry-overlay"]');
await page.locator('[data-testid="registry-tab-agents"]').click();
await page.locator(`[data-testid="registry-row-${withParent}"]`).click();
await page.waitForSelector('[data-testid="registry-agent-detail"]');
await page.waitForTimeout(150);
const counts = await page.evaluate(() => {
  const overlay = document.querySelector('[data-testid="registry-overlay"]');
  const all = Array.from(overlay.querySelectorAll('button')).map((b) => (b.textContent ?? '').trim());
  return {
    parentChips: all.filter((t) => t.startsWith('parent ⟶')).length,
    chipTexts: all.filter((t) => t.includes('⟶')),
  };
});
console.log(JSON.stringify(counts, null, 2));
await page.screenshot({ path: path.join(outDir, 'v5-r1-after-registry-session-detail-parent.png') });
await browser.close();
