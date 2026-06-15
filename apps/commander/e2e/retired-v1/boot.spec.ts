/**
 * boot.spec.ts — SPEC §13: AC1, AC12, AC14 (plus the AC13 e2e smoke, which §13 leaves
 * unassigned; it belongs with the boot/determinism cluster).
 * All tests drive determinism via `/?seed=42` + pause-on-boot + `sim.tick(n)` (SPEC §9, §13).
 */
import { expect, test } from '@playwright/test';
import { bootWarRoom, captureUnitIcons, SEL, tick, tickUntil, topbarTexts } from '../helpers';

test('AC1: /?seed=42 boots the war room with units, task nodes, non-zero counters and no console errors', async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  await bootWarRoom(page, { seed: 42 });

  // AC1: "boots to the war room: ≥10 unit sprites"
  await expect.poll(() => page.locator(SEL.unit).count()).toBeGreaterThanOrEqual(10);

  // AC1: "≥6 task nodes"
  await expect.poll(() => page.locator(SEL.task).count()).toBeGreaterThanOrEqual(6);

  // AC1: "top bar counters non-zero" — topbar-* elements exist (§9) and at least one
  // rendered resource counter (§4: units/busy · tokens · tasks · ⚠ · clock) is non-zero.
  const bars = await topbarTexts(page);
  expect(Object.keys(bars).length).toBeGreaterThan(0);
  const numbers = Object.values(bars).flatMap((t) =>
    (t.match(/\d+(?:\.\d+)?/g) ?? []).map(Number),
  );
  expect(numbers.some((n) => n > 0)).toBe(true);

  // AC1: "no console errors"
  const errors = consoleErrors.filter((t) => !/favicon/i.test(t));
  expect(errors).toEqual([]);
});

test('AC12: every unit/task renders an inline SVG portrait; reloading with the same seed renders identical icons', async ({
  page,
}) => {
  await bootWarRoom(page, { seed: 42 });

  // AC12: "every unit/task renders an inline SVG portrait"
  const census = await page.evaluate(() => {
    const all = (sel: string) => Array.from(document.querySelectorAll(sel));
    const withSvg = (sel: string) => all(sel).filter((el) => el.querySelector('svg')).length;
    return {
      units: all('[data-testid^="unit-"]').length,
      unitsWithSvg: withSvg('[data-testid^="unit-"]'),
      tasks: all('[data-testid^="task-"]').length,
      tasksWithSvg: withSvg('[data-testid^="task-"]'),
    };
  });
  expect(census.units).toBeGreaterThan(0);
  expect(census.unitsWithSvg).toBe(census.units);
  expect(census.tasks).toBeGreaterThan(0);
  expect(census.tasksWithSvg).toBe(census.tasks);

  const before = await captureUnitIcons(page, 8);
  expect(Object.keys(before).length).toBeGreaterThanOrEqual(2);

  // Reload with the same seed (fresh page load, identical PRNG seed — SPEC §7).
  await bootWarRoom(page, { seed: 42 });
  const after = await captureUnitIcons(page, 8);

  // AC12: "reloading with the same seed renders identical icons (compare two `unit-*` icon
  // outerHTML across reloads)" — §8: "Same id ⇒ byte-identical SVG".
  const common = Object.keys(before).filter((k) => k in after);
  expect(common.length).toBeGreaterThanOrEqual(2);
  for (const key of common) {
    expect(after[key], `icon SVG for ${key} must be byte-identical across reloads`).toBe(
      before[key],
    );
  }
});

test('AC13: with sim paused, tick(20) from the same seed yields stable UI across reloads (e2e smoke)', async ({
  page,
}) => {
  test.setTimeout(120_000);
  // AC13: "Determinism: with sim paused, `tick(20)` twice from the same seed yields identical
  // store snapshots (unit test) and stable UI (e2e smoke)". Exact snapshot equality is the
  // unit test's job; here we verify the UI census is identical for seed 42 + 20 ticks.
  const fingerprint = async (): Promise<string> => {
    await tick(page, 20);
    return page.evaluate(() => {
      const ids = (sel: string) =>
        Array.from(document.querySelectorAll(sel))
          .map((el) => el.getAttribute('data-testid') ?? '')
          .sort();
      const topbar = Array.from(document.querySelectorAll('[data-testid^="topbar-"]'))
        .map((el) => `${el.getAttribute('data-testid')}=${(el.textContent ?? '').trim()}`)
        .sort()
        .join('|');
      return JSON.stringify({
        units: ids('[data-testid^="unit-"]'),
        tasks: ids('[data-testid^="task-"]'),
        topbar,
        tickerItems: document.querySelectorAll('[data-testid="ticker-item"]').length,
      });
    });
  };

  await bootWarRoom(page, { seed: 42 });
  const first = await fingerprint();

  await bootWarRoom(page, { seed: 42 }); // fresh load, same seed, same pause + tick(20)
  const second = await fingerprint();

  // AC13: same seed + same tick count ⇒ identical world/HUD census.
  expect(second).toBe(first);
});

test('AC14: tokens-burned counter increases over sim time; tasks done/total updates on completion', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await bootWarRoom(page, { seed: 42 });

  // AC14: "Top bar tokens-burned counter increases over sim time" — §4 resources include
  // "tokens burned"; the topbar-* testid for it must identify itself (contains "token").
  const tokenCounter = page.locator('[data-testid^="topbar-"][data-testid*="token"]').first();
  await expect(tokenCounter).toBeVisible();
  const tokensBefore = (await tokenCounter.innerText()).trim();
  const tokensChanged = await tickUntil(
    page,
    async () => (await tokenCounter.innerText()).trim() !== tokensBefore,
    { chunk: 10, maxChunks: 60 },
  );
  expect(tokensChanged, 'tokens counter must change as the sim burns tokens').toBe(true);
  const tokensAfter = (await tokenCounter.innerText()).trim();
  const beforeNum = parseFloat((tokensBefore.match(/\d+(?:\.\d+)?/) ?? ['NaN'])[0]);
  const afterNum = parseFloat((tokensAfter.match(/\d+(?:\.\d+)?/) ?? ['NaN'])[0]);
  if (
    !Number.isNaN(beforeNum) &&
    !Number.isNaN(afterNum) &&
    !/[a-z]/i.test(tokensBefore + tokensAfter) // skip ordering check on abbreviated formats (e.g. "1.2k")
  ) {
    expect(afterNum).toBeGreaterThanOrEqual(beforeNum);
  }

  // AC14: "tasks done/total updates on completion" — advance sim until a completion moves the counter.
  const tasksCounter = page.locator('[data-testid^="topbar-"][data-testid*="task"]').first();
  await expect(tasksCounter).toBeVisible();
  const tasksBefore = (await tasksCounter.innerText()).trim();
  const tasksChanged = await tickUntil(
    page,
    async () => (await tasksCounter.innerText()).trim() !== tasksBefore,
    { chunk: 25, maxChunks: 80 },
  );
  expect(tasksChanged, 'tasks done/total must update when a task completes').toBe(true);
});
