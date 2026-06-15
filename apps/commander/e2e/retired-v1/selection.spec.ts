/**
 * selection.spec.ts — SPEC §13: AC2 (click select), AC3 (marquee multi-select), AC8 (control groups).
 * Deterministic: `/?seed=42`, sim paused on boot, time advanced only via tick(n) (SPEC §9, §13).
 */
import { expect, test } from '@playwright/test';
import { bootWarRoom, getSelectionIds, marqueeSelectAll, SEL } from '../helpers';

test('AC2: clicking a unit selects it and populates SelectionPanel + CommandCard', async ({
  page,
}) => {
  await bootWarRoom(page, { seed: 42 });

  const units = page.locator(SEL.unit);
  const first = units.nth(0);
  const second = units.nth(1);
  const firstId = ((await first.getAttribute('data-testid')) ?? '').replace(/^unit-/, '');
  const secondId = ((await second.getAttribute('data-testid')) ?? '').replace(/^unit-/, '');
  expect(firstId).not.toBe('');
  expect(secondId).not.toBe('');

  // AC2: "Clicking a unit selects it" (§5 left-click select; §6 selection slice is the
  // ordered entityId[] — the store-side truth behind the visible selection ring).
  await first.click();
  expect(await getSelectionIds(page)).toEqual([firstId]);

  // AC2: "SelectionPanel shows portrait/name/adapter/model/state/vitals"
  const panel = page.locator(SEL.selectionPanel).first();
  await expect(panel).toBeVisible();
  await expect(panel.locator('svg').first()).toBeVisible(); // procedural portrait (§8)
  // adapter faction (§7: claude-code, codex, gemini-cli, pi, … §3: cursor)
  await expect(panel).toContainText(/claude-code|codex|gemini-cli|cursor|\bpi\b/i);
  // unit visual state (§3)
  await expect(panel).toContainText(
    /idle|dispatching|thinking|tool[_ ]?running|awaiting|blocked|completed|failed/i,
  );

  // AC2: "CommandCard fills with contextual commands" (§8: always ≤12)
  const cmdCount = await page.locator(SEL.cmd).count();
  expect(cmdCount).toBeGreaterThan(0);
  expect(cmdCount).toBeLessThanOrEqual(12);

  // AC2/§5: "Left-click unit/task: select (clears previous)" — clicking another unit replaces
  // the selection rather than adding to it.
  await second.click();
  expect(await getSelectionIds(page)).toEqual([secondId]);
});

test('AC3: marquee drag selects multiple units; SelectionPanel shows a card grid; CommandCard shows intersection commands', async ({
  page,
}) => {
  await bootWarRoom(page, { seed: 42 });

  // AC3: "Marquee drag selects multiple units" (§5: drag on empty map selects units inside rect)
  await marqueeSelectAll(page);
  const ids = await getSelectionIds(page);
  expect(ids.length).toBeGreaterThanOrEqual(2);

  // AC3: "SelectionPanel shows card grid" (§4: multi → unit card grid, one portrait per unit)
  const panel = page.locator(SEL.selectionPanel).first();
  await expect(panel).toBeVisible();
  expect(await panel.locator('svg').count()).toBeGreaterThanOrEqual(2);

  // AC3: "CommandCard shows intersection commands" (§8: mixed selections get the intersection; ≤12)
  const cmdCount = await page.locator(SEL.cmd).count();
  expect(cmdCount).toBeGreaterThan(0);
  expect(cmdCount).toBeLessThanOrEqual(12);
});

test('AC8: Ctrl+1 stores the selection; pressing 1 after deselecting recalls it', async ({
  page,
}) => {
  await bootWarRoom(page, { seed: 42 });

  await marqueeSelectAll(page);
  const saved = await getSelectionIds(page);
  expect(saved.length).toBeGreaterThanOrEqual(1);

  // AC8: "Ctrl+1 stores the selection" (§5: Ctrl+1..9 assign control group)
  await page.keyboard.press('Control+Digit1');

  // Deselect (§5: Esc clears selection when the inspector is closed).
  await page.keyboard.press('Escape');
  await expect.poll(() => getSelectionIds(page)).toEqual([]);

  // AC8: "pressing 1 after deselecting recalls it" (§5: 1..9 recall)
  await page.keyboard.press('Digit1');
  await expect
    .poll(async () => (await getSelectionIds(page)).slice().sort())
    .toEqual(saved.slice().sort());
});
