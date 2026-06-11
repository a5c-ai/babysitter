/**
 * TEMP art-direction review capture script (not a test; .mjs so vitest/playwright ignore it).
 * Boots /?seed=42 at 1600x900, stages six states via SPEC §9 test hooks, saves PNGs here.
 * Run from apps/commander:  node e2e/__shots__/capture-review.mjs
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = path.dirname(fileURLToPath(import.meta.url));
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});

// Pause-on-boot poller (SPEC §13): halt the sim before the first auto-tick.
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
await page.waitForSelector('[data-testid^="unit-"]');
await page.waitForSelector('[data-testid^="task-"]');

const tick = (n) => page.evaluate((c) => window.__commander.sim.tick(c), n);
const snap = () =>
  page.evaluate(() => {
    const s = window.__commander.store.getState();
    return {
      unitIds: s.world.unitIds,
      units: Object.fromEntries(
        s.world.unitIds.map((id) => {
          const u = s.world.units[id];
          return [id, { state: u.view.state, taskId: u.view.taskId, transcriptLen: u.transcript.length, agent: u.view.agent }];
        }),
      ),
      taskIds: s.world.taskIds,
      tasks: Object.fromEntries(
        s.world.taskIds.map((id) => {
          const t = s.world.tasks[id];
          return [id, { state: t.view.state, assignees: t.view.assigneeIds.length }];
        }),
      ),
      positions: s.world.positions,
      alerts: s.alerts.map((a) => ({ id: a.hookRequestId, unitId: a.unitId, kind: a.kind })),
    };
  });
const shot = async (name) => {
  await page.waitForTimeout(700); // let CSS glides/transitions settle
  await page.screenshot({ path: path.join(outDir, name) });
  console.log('captured', name);
};

// ---------------------------------------------------------------- 1. boot overview (~30 ticks)
await tick(30);
await shot('01-boot-overview.png');

// ------------------------------------------------- 2. single idle unit selected + command card
let st = await snap();
let idleId = st.unitIds.find((id) => st.units[id].state === 'idle');
for (let i = 0; i < 40 && !idleId; i++) {
  await tick(5);
  st = await snap();
  idleId = st.unitIds.find((id) => st.units[id].state === 'idle');
}
if (!idleId) throw new Error('no idle unit found');
await page.evaluate((id) => {
  const s = window.__commander.store.getState();
  s.select([id]);
  s.centerOnEntity(id);
}, idleId);
await shot('02-single-idle-selected.png');

// ---------------------------------------------------------- 3. multi-selection (5+ unit grid)
await page.evaluate(() => {
  const s = window.__commander.store.getState();
  s.select(s.world.unitIds.slice(0, 6));
});
await shot('03-multi-selection.png');

// --------------------------------------- 4. alert/approval state with AlertBanner + minimap
st = await snap();
for (let i = 0; i < 120 && st.alerts.length === 0; i++) {
  await tick(5);
  st = await snap();
}
if (st.alerts.length === 0) throw new Error('no hook.request fired after 600 ticks');
const alert = st.alerts[st.alerts.length - 1];
await page.evaluate((unitId) => {
  const s = window.__commander.store.getState();
  s.select([unitId]);
  s.jumpToLatestAlert();
}, alert.unitId);
await shot('04-alert-banner.png');

// ----------------------------------------- 5. inspector on a working unit with transcript
st = await snap();
const working = () =>
  st.unitIds.find(
    (id) => ['thinking', 'tool_running'].includes(st.units[id].state) && st.units[id].transcriptLen >= 4,
  );
let workId = working();
for (let i = 0; i < 60 && !workId; i++) {
  await tick(5);
  st = await snap();
  workId = working();
}
if (!workId) throw new Error('no working unit with transcript found');
await page.evaluate((id) => {
  const s = window.__commander.store.getState();
  s.select([id]);
  s.centerOnEntity(id);
  s.openInspector(id);
}, workId);
await tick(6); // let the transcript grow while inspector is open
await shot('05-inspector-transcript.png');

// ----------------- 6. zoomed close-up: 3-4 unit sprites + task node at zoom ~1.4 (icon charm)
await page.evaluate(() => window.__commander.store.getState().closeInspector());
st = await snap();
// pick the task with the most assignees; rally extra idle units next to it for a crowd
const bestTask = [...st.taskIds].sort((a, b) => st.tasks[b].assignees - st.tasks[a].assignees)[0];
const taskPos = st.positions[bestTask];
const idleIds = st.unitIds.filter((id) => st.units[id].state === 'idle' && !st.units[id].taskId).slice(0, 4);
await page.evaluate(({ taskId, pos, idle }) => {
  const s = window.__commander.store.getState();
  if (idle.length > 0) s.setRally(idle, { x: pos.x - 120, y: pos.y + 90 });
  s.select(idle.slice(0, 1));
  s.setCamera({ x: pos.x - 40, y: pos.y + 30, zoom: 1.4 });
  void taskId;
}, { taskId: bestTask, pos: taskPos, idle: idleIds });
await page.waitForTimeout(900); // unit glide is CSS-animated
await shot('06-zoom-closeup.png');

console.log('console errors:', JSON.stringify(consoleErrors, null, 2));
await browser.close();
