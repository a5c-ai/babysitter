/**
 * TEMP v5-r0 self-check capture (not a test). Run: node e2e/__shots__/capture-v5-r0.mjs
 * Stages: atomic release train while PAUSED (state-side check + glide stagger),
 * registry session detail (capped measure), registry stacks/workspaces tabs,
 * sessions list chips (creature-name reviewed links), archive deep-zoom clamp.
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
  page.screenshot({ path: path.join(outDir, `v5-r0-after-${name}.png`), ...(clip ? { clip } : {}) });

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
console.log('merged cards before release:', merged);

// ---- 1. release train: sim PAUSED, pull the lever, NO ticks ------------------
// State-side: every wagon must be in-production IMMEDIATELY (atomic verb);
// the visible stagger is animation-only.
await page.waitForTimeout(800); // let prior FLIP glides settle
const paused = await page.evaluate(() => window.__commander.store.getState().meta.paused);
console.log('sim paused before lever:', paused);
await page.locator('[data-testid="col-release"]').click();
// Immediately after the click — no ticks — probe sim state.
const stateSide = await page.evaluate(() => {
  const s = window.__commander.store.getState();
  return s.board.cardIds
    .map((id) => s.board.cards[id].view)
    .filter((v) => v.releaseId !== null && v.parentId === null)
    .map((v) => ({ taskId: v.taskId, column: v.column, releaseId: v.releaseId }));
});
console.log('state-side after lever (paused, zero ticks):', JSON.stringify(stateSide, null, 2));
await page.waitForTimeout(180); // mid-glide: wagons staggered in flight
await shot('01-release-train-paused-midflight');
await page.waitForTimeout(2400);
await shot('01b-release-train-paused-settled', { x: 900, y: 90, width: 700, height: 620 });

// ---- 2/3/4. the Registry ------------------------------------------------------
await page.evaluate(() => window.__commander.store.getState().openRegistry());
await page.waitForSelector('[data-testid="registry-overlay"]');
await shot('02-registry-stacks-tab');

// workspaces tab (boxed parchment plates + chip column)
await page.locator('[data-testid="registry-tab-workspaces"]').click();
await page.waitForTimeout(150);
await shot('03-registry-workspaces-tab');

// agents tab → session detail (capped transcript measure + legible chips)
await page.locator('[data-testid="registry-tab-agents"]').click();
await page.waitForTimeout(150);
await shot('04-registry-agents-tab');
const firstSession = await page.evaluate(() => {
  const sessions = window.__commander.sim.listSessions();
  const done = sessions.find((s) => s.status === 'completed') ?? sessions[0];
  return done?.sessionId ?? null;
});
console.log('opening registry session detail:', firstSession);
await page.locator(`[data-testid="registry-row-${firstSession}"]`).click();
await page.waitForSelector('[data-testid="registry-agent-detail"]');
await page.waitForTimeout(150);
await shot('05-registry-session-detail');
await page.keyboard.press('Escape');
await page.waitForTimeout(200);

// ---- 5. sessions list chips (reviewed-link creature names) --------------------
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
  await shot('06-sessions-list-chips');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
}

// ---- 6. archive deep-zoom clamp ------------------------------------------------
await page.evaluate(() => window.__commander.store.getState().openArchive());
await page.waitForSelector('[data-testid="memory-overlay"]');
const svgBox = await page.locator('[data-testid="memory-overlay"] svg').first().boundingBox();
// Wheel-zoom hard at the far bottom-right corner — the centroid bias must
// keep the graph from vanishing off-plate.
await page.mouse.move(svgBox.x + svgBox.width - 30, svgBox.y + svgBox.height - 30);
for (let i = 0; i < 14; i++) await page.mouse.wheel(0, -240);
await page.waitForTimeout(250);
await shot('07-archive-corner-deep-zoom');

await browser.close();
console.log('capture complete');
