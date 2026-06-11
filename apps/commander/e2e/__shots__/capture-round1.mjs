/**
 * TEMP art-direction review capture script — ROUND 1 (not a test; .mjs so vitest/playwright ignore it).
 * Boots /?seed=42 at 1600x900, stages six states via SPEC §9 test hooks, saves round1-*.png here.
 * Run from apps/commander:  node e2e/__shots__/capture-round1.mjs
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
await shot('round1-01-boot-overview.png');

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
await shot('round1-02-single-idle-selected.png');

// -------------------- 3. MIXED-state multi-selection: units in >=2 distinct states (staples card)
st = await snap();
const distinctStates = () => new Set(st.unitIds.map((id) => st.units[id].state)).size;
for (let i = 0; i < 60 && distinctStates() < 3; i++) {
  await tick(5);
  st = await snap();
}
// pick up to 6 units maximizing state diversity: one per state first, then fill
const byState = new Map();
for (const id of st.unitIds) {
  const k = st.units[id].state;
  if (!byState.has(k)) byState.set(k, []);
  byState.get(k).push(id);
}
const mixed = [];
for (const ids of byState.values()) mixed.push(ids[0]);
for (const ids of byState.values()) {
  for (const id of ids.slice(1)) if (mixed.length < 6) mixed.push(id);
}
const mixedStates = [...new Set(mixed.map((id) => st.units[id].state))];
if (mixedStates.length < 2) throw new Error('could not assemble a mixed-state selection');
console.log('mixed selection states:', mixedStates.join(', '));
await page.evaluate((ids) => {
  const s = window.__commander.store.getState();
  s.select(ids);
}, mixed.slice(0, 6));
await shot('round1-03-mixed-multi-selection.png');

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
await shot('round1-04-alert-banner.png');

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
await shot('round1-05-inspector-transcript.png');

// ------- 6. zoomed close-up (~1.4): 3-4 unit sprites + a QUEUED task node (luminous dashed ring)
await page.evaluate(() => window.__commander.store.getState().closeInspector());
st = await snap();
let queuedTask = st.taskIds.find((id) => st.tasks[id].state === 'queued');
for (let i = 0; i < 40 && !queuedTask; i++) {
  await tick(5);
  st = await snap();
  queuedTask = st.taskIds.find((id) => st.tasks[id].state === 'queued');
}
if (!queuedTask) throw new Error('no queued task node found');
const taskPos = st.positions[queuedTask];
const idleIds = st.unitIds.filter((id) => st.units[id].state === 'idle' && !st.units[id].taskId).slice(0, 4);
await page.evaluate(({ pos, idle }) => {
  const s = window.__commander.store.getState();
  if (idle.length > 0) s.setRally(idle, { x: pos.x - 120, y: pos.y + 90 });
  s.select(idle.slice(0, 1));
  s.setCamera({ x: pos.x - 40, y: pos.y + 30, zoom: 1.4 });
}, { pos: taskPos, idle: idleIds });
await page.waitForTimeout(900); // unit glide is CSS-animated
await shot('round1-06-zoom-queued-closeup.png');

console.log('queued task framed:', queuedTask);
console.log('console errors:', JSON.stringify(consoleErrors, null, 2));
await browser.close();
