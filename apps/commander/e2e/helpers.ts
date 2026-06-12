/**
 * Shared helpers for the A5C Commander e2e suite.
 *
 * Authored strictly from SPEC.md — these tests are FROZEN inputs; the implementation
 * is built to satisfy them, never the other way around.
 *
 * Determinism contract (SPEC §9, §13):
 *  - Every test boots `/?seed=<seed>` (default 42).
 *  - The simulation is paused as early as possible via an init-script poller that calls
 *    `window.__commander.sim.pause()` the instant the test-hooks API appears, so zero
 *    (or a stable number of) auto-ticks run before the test takes control.
 *  - Time advances exclusively through `window.__commander.sim.tick(n)`.
 *  - No timing-based waits beyond UI settle (Playwright auto-waiting / expect polling).
 *
 * Selector contract (SPEC §9): `unit-<id>`, `task-<id>`, `cmd-<commandId>`, `minimap`,
 * `ticker-item`, `selection-panel`, `alert-banner`, `topbar-*`, `inspector`.
 * Where an id value is unknowable from the spec, we select by prefix.
 */
import { expect, type Locator, type Page } from '@playwright/test';

/** Shape of the SPEC §9 test hooks API exposed on `window.__commander`. */
export interface CommanderTestApi {
  sim: {
    pause(): void;
    resume(): void;
    tick(n: number): void;
    seed: number;
  };
  /** SPEC §6/§9: the single Zustand store (Zustand stores expose `getState()`). */
  store: { getState?: () => unknown } & Record<string, unknown>;
  version: string;
}

/** SPEC §6: `camera`: `{x, y, zoom}` with clamped bounds. */
export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

/** SPEC §6: `alerts`: pending approvals `{hookRequestId, runId, unitId, kind, payload, deadlineTs}`. */
export interface AlertEntry {
  hookRequestId?: string;
  runId?: string;
  unitId?: string;
  kind?: string;
}

/** SPEC §9 data-testid contract. */
export const SEL = {
  unit: '[data-testid^="unit-"]',
  task: '[data-testid^="task-"]',
  cmd: '[data-testid^="cmd-"]',
  minimap: '[data-testid="minimap"]',
  tickerItem: '[data-testid="ticker-item"]',
  selectionPanel: '[data-testid="selection-panel"]',
  alertBanner: '[data-testid="alert-banner"]',
  topbar: '[data-testid^="topbar-"]',
  inspector: '[data-testid="inspector"]',
} as const;

export interface BootOptions {
  seed?: number;
  /** Pause the sim the moment `window.__commander` appears (default true; SPEC §13 "pause sim on load"). */
  pauseOnBoot?: boolean;
}

/**
 * Boot the war room deterministically: `/?seed=<seed>`, pause-on-boot, and wait for the
 * seeded world (SPEC §7: 10–16 units, 6–10 tasks exist at boot).
 */
export async function bootWarRoom(page: Page, opts: BootOptions = {}): Promise<void> {
  const { seed = 42, pauseOnBoot = true } = opts;
  if (pauseOnBoot) {
    await page.addInitScript(() => {
      const iv = setInterval(() => {
        const w = window as unknown as { __commander?: { sim?: { pause?: () => void } } };
        if (w.__commander?.sim?.pause) {
          try {
            w.__commander.sim.pause();
          } catch {
            /* ignore — sim may pause itself */
          }
          clearInterval(iv);
        }
      }, 5);
      setTimeout(() => clearInterval(iv), 30_000);
    });
  }
  await page.goto(`/?seed=${seed}`);
  await page.waitForFunction(
    () => Boolean((window as unknown as { __commander?: unknown }).__commander),
  );
  await expect(page.locator(SEL.unit).first()).toBeVisible();
  await expect(page.locator(SEL.task).first()).toBeVisible();
}

/** Advance the (paused) simulation by `n` ticks via the SPEC §9 hook. */
export async function tick(page: Page, n: number): Promise<void> {
  await page.evaluate((count: number) => {
    const w = window as unknown as { __commander: { sim: { tick(n: number): void } } };
    w.__commander.sim.tick(count);
  }, n);
}

export async function pauseSim(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { __commander: { sim: { pause(): void } } };
    w.__commander.sim.pause();
  });
}

export async function resumeSim(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { __commander: { sim: { resume(): void } } };
    w.__commander.sim.resume();
  });
}

/** SPEC §6 camera slice `{x, y, zoom}`. */
export async function getCamera(page: Page): Promise<CameraState> {
  return page.evaluate(() => {
    const w = window as unknown as { __commander: { store: { getState?: () => unknown } } };
    const store = w.__commander.store;
    const state = ((typeof store.getState === 'function' ? store.getState() : store) ??
      {}) as Record<string, unknown>;
    const cam = (state['camera'] ?? {}) as Record<string, unknown>;
    return { x: Number(cam['x']), y: Number(cam['y']), zoom: Number(cam['zoom']) };
  });
}

/** SPEC §6 alerts slice — normalized to a plain array regardless of container shape. */
export async function getAlerts(page: Page): Promise<AlertEntry[]> {
  return page.evaluate(() => {
    const w = window as unknown as { __commander: { store: { getState?: () => unknown } } };
    const store = w.__commander.store;
    const state = ((typeof store.getState === 'function' ? store.getState() : store) ??
      {}) as Record<string, unknown>;
    const raw = state['alerts'];
    let list: unknown[] = [];
    if (Array.isArray(raw)) {
      list = raw;
    } else if (raw instanceof Map) {
      list = [...raw.values()];
    } else if (raw && typeof raw === 'object') {
      const values = Object.values(raw as Record<string, unknown>);
      const firstArray = values.find((v) => Array.isArray(v));
      list = firstArray ? (firstArray as unknown[]) : values;
    }
    return list.map((a) => {
      const r = (a ?? {}) as Record<string, unknown>;
      const str = (k: string): string | undefined =>
        typeof r[k] === 'string' ? (r[k] as string) : undefined;
      return {
        hookRequestId: str('hookRequestId'),
        runId: str('runId'),
        unitId: str('unitId'),
        kind: str('kind'),
      };
    });
  });
}

/** SPEC §6 selection slice: ordered `entityId[]` — normalized defensively. */
export async function getSelectionIds(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const w = window as unknown as { __commander: { store: { getState?: () => unknown } } };
    const store = w.__commander.store;
    const state = ((typeof store.getState === 'function' ? store.getState() : store) ??
      {}) as Record<string, unknown>;
    const sel = state['selection'];
    const isStringArray = (v: unknown): v is string[] =>
      Array.isArray(v) && v.every((x) => typeof x === 'string');
    if (isStringArray(sel)) return sel;
    if (sel && typeof sel === 'object') {
      const rec = sel as Record<string, unknown>;
      for (const key of ['ids', 'order', 'ordered', 'selected', 'entityIds', 'selectedIds', 'current']) {
        const v = rec[key];
        if (isStringArray(v)) return v;
        if (v instanceof Set) return [...v].filter((x): x is string => typeof x === 'string');
      }
      for (const [key, value] of Object.entries(rec)) {
        if (/group/i.test(key)) continue; // skip control groups Record<digit, entityId[]>
        if (isStringArray(value)) return value;
        if (value instanceof Set) return [...value].filter((x): x is string => typeof x === 'string');
      }
    }
    return [];
  });
}

/** Lower-cased innerText of the SelectionPanel, or '' when hidden/absent. */
export async function selectionPanelText(page: Page): Promise<string> {
  const panel = page.locator(SEL.selectionPanel).first();
  const visible = await panel.isVisible().catch(() => false);
  if (!visible) return '';
  return (await panel.innerText()).toLowerCase();
}

/** Locate a unit sprite by entity id (SPEC §9: `unit-<id>`). */
export function unitById(page: Page, unitId: string): Locator {
  return page.locator(`[data-testid="unit-${unitId}"]`).first();
}

/** Locate a task node by entity id (SPEC §9: `task-<id>`). */
export function taskById(page: Page, taskId: string): Locator {
  return page.locator(`[data-testid="task-${taskId}"]`).first();
}

/** Locate a command-card cell by its visible label (command ids are unknowable from spec). */
export function commandCell(page: Page, label: RegExp): Locator {
  return page.locator(SEL.cmd).filter({ hasText: label }).first();
}

/**
 * Click unit sprites until the SelectionPanel reports an `idle` unit (SPEC §3 visual states).
 * Returns the selected unit and its entity id.
 */
export async function selectIdleUnit(page: Page): Promise<{ unit: Locator; unitId: string }> {
  const units = page.locator(SEL.unit);
  const count = await units.count();
  for (let i = 0; i < count; i++) {
    const unit = units.nth(i);
    const testid = (await unit.getAttribute('data-testid')) ?? '';
    if (!testid.startsWith('unit-')) continue;
    await unit.click();
    const text = await selectionPanelText(page);
    if (/\bidle\b/.test(text)) {
      return { unit: unitById(page, testid.slice('unit-'.length)), unitId: testid.slice('unit-'.length) };
    }
  }
  throw new Error(
    'No idle unit found at boot (SPEC §7 seeds 10–16 units with seed 42; expected at least one idle).',
  );
}

/**
 * Issue a dispatch order: select an idle unit, right-click a task node (SPEC §5),
 * advance a couple of ticks, and return both entity ids.
 */
export async function dispatchIdleUnitToTask(
  page: Page,
): Promise<{ unitId: string; taskId: string }> {
  const { unitId } = await selectIdleUnit(page);
  const task = page.locator(SEL.task).first();
  const taskTestid = (await task.getAttribute('data-testid')) ?? 'task-';
  await task.click({ button: 'right' });
  await tick(page, 2);
  return { unitId, taskId: taskTestid.slice('task-'.length) };
}

/**
 * Advance the paused sim in bounded chunks until `predicate` holds.
 * Tick-driven (SPEC §13) — never wall-clock-driven.
 */
export async function tickUntil(
  page: Page,
  predicate: () => Promise<boolean>,
  opts: { chunk?: number; maxChunks?: number } = {},
): Promise<boolean> {
  // default budget doubled for the SPEC-V4 §V4-4 pacing slowdown (sanctioned by the SPEC-V4
  // header: budgets are not semantic assertions)
  const { chunk = 5, maxChunks = 120 } = opts;
  if (await predicate()) return true;
  for (let i = 0; i < maxChunks; i++) {
    await tick(page, chunk);
    if (await predicate()) return true;
  }
  return false;
}

/** Find a map point not covered by any unit/task sprite (for marquee start / empty-ground clicks). */
export async function findEmptyMapPoint(page: Page): Promise<{ x: number; y: number }> {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('viewport size unavailable');
  const occupied: Array<{ x: number; y: number; w: number; h: number }> = [];
  for (const sel of [SEL.unit, SEL.task]) {
    const els = page.locator(sel);
    const n = await els.count();
    for (let i = 0; i < n; i++) {
      const box = await els.nth(i).boundingBox();
      if (box) occupied.push({ x: box.x, y: box.y, w: box.width, h: box.height });
    }
  }
  const margin = 40;
  // Sample inside the map area, clear of HUD chrome (§4: top bar at top, panels at bottom,
  // minimap top-right) — y in [120, 65% height), x in [80, 70% width).
  for (let y = 120; y < viewport.height * 0.65; y += 60) {
    for (let x = 80; x < viewport.width * 0.7; x += 80) {
      const overlaps = occupied.some(
        (b) =>
          x >= b.x - margin &&
          x <= b.x + b.w + margin &&
          y >= b.y - margin &&
          y <= b.y + b.h + margin,
      );
      if (!overlaps) return { x, y };
    }
  }
  throw new Error('no empty map point found for marquee/empty-ground interaction');
}

/**
 * Marquee-select: press on empty ground and drag a large rectangle across the map
 * (SPEC §5: "Drag on empty map: marquee select units inside rect").
 */
export async function marqueeSelectAll(page: Page): Promise<void> {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('viewport size unavailable');
  const start = await findEmptyMapPoint(page);
  const end = { x: viewport.width * 0.88, y: viewport.height * 0.6 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  for (const f of [0.25, 0.5, 0.75, 1]) {
    await page.mouse.move(
      start.x + (end.x - start.x) * f,
      start.y + (end.y - start.y) * f,
      { steps: 4 },
    );
  }
  await page.mouse.up();
}

/**
 * Capture `unit-<id>` → first inline `<svg>` outerHTML (the procedural portrait, SPEC §8:
 * "Same id ⇒ byte-identical SVG").
 */
export async function captureUnitIcons(page: Page, limit = 8): Promise<Record<string, string>> {
  return page.evaluate((max: number) => {
    const out: Record<string, string> = {};
    const nodes = Array.from(document.querySelectorAll('[data-testid^="unit-"]'));
    for (const node of nodes.slice(0, max)) {
      const id = node.getAttribute('data-testid') ?? '';
      const svg = node.querySelector('svg');
      if (id && svg) out[id] = svg.outerHTML;
    }
    return out;
  }, limit);
}

/** All `topbar-*` elements: testid → trimmed text (SPEC §9: `topbar-*`). */
export async function topbarTexts(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const out: Record<string, string> = {};
    for (const el of Array.from(document.querySelectorAll('[data-testid^="topbar-"]'))) {
      const id = el.getAttribute('data-testid') ?? '';
      out[id] = (el.textContent ?? '').trim();
    }
    return out;
  });
}

/**
 * Count SVG link-shaped elements (`line`/`polyline`) document-wide.
 * SPEC §4: "SVG link layer: unit↔assigned task lines" — a dispatch must add at least one.
 */
export async function countSvgLinkShapes(page: Page): Promise<number> {
  return page.evaluate(() => document.querySelectorAll('svg line, svg polyline').length);
}
