/**
 * stream.spec.ts — SPEC §13: AC10 (event ticker stream + click-to-select) and AC11 (inspector transcript).
 * Deterministic: `/?seed=42`, sim paused on boot, time advanced only via tick(n) (SPEC §9, §13).
 */
import { expect, test } from '@playwright/test';
import {
  bootWarRoom,
  dispatchIdleUnitToTask,
  getCamera,
  getSelectionIds,
  SEL,
  selectionPanelText,
  tick,
  tickUntil,
  unitById,
} from '../helpers';

test('AC10: EventTicker streams items; clicking an item with an entity selects and centers that entity', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await bootWarRoom(page, { seed: 42 });

  // AC10: "EventTicker streams items during sim run" — items accumulate as sim time advances.
  const streamed = await tickUntil(
    page,
    async () => (await page.locator(SEL.tickerItem).count()) >= 1,
    { chunk: 10, maxChunks: 40 },
  );
  expect(streamed, 'ticker must stream items as the sim advances').toBe(true);

  // Guarantee at least one entity-linked ticker entry: a dispatch order is logged with its
  // unit (AC4: "ticker logs the order"; §6 ticker entries carry optional entityId).
  await dispatchIdleUnitToTask(page);
  await tick(page, 3);
  await page.keyboard.press('Escape'); // clear selection so the ticker click is what selects

  // Pan the camera away so "centers that entity" is observable as a camera change.
  for (let i = 0; i < 25; i++) await page.keyboard.press('ArrowRight');
  const before = await getCamera(page);

  // AC10: "clicking an item with an entity selects + centers that entity" — not every entry
  // has an entityId (§6), so click items until one selects.
  const items = page.locator(SEL.tickerItem);
  const count = await items.count();
  let selected = false;
  for (let i = 0; i < count && !selected; i++) {
    await items.nth(i).click();
    selected = (await getSelectionIds(page)).length > 0;
  }
  expect(selected, 'clicking a ticker item that references an entity must select it').toBe(true);
  await expect(page.locator(SEL.selectionPanel).first()).toBeVisible();
  const after = await getCamera(page);
  expect(
    after.x !== before.x || after.y !== before.y,
    'the ticker click must center the camera on the entity',
  ).toBe(true);
});

test('AC11: double-clicking a working unit opens the Inspector with a growing transcript', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await bootWarRoom(page, { seed: 42 });

  const { unitId } = await dispatchIdleUnitToTask(page);

  // Advance until the unit is actively working (§3: dispatching → thinking → tool_running).
  await unitById(page, unitId).click();
  const working = await tickUntil(
    page,
    async () => /thinking|tool[_ ]?running/.test(await selectionPanelText(page)),
    { chunk: 3, maxChunks: 60 },
  );
  expect(working, 'unit must reach a working state before inspecting').toBe(true);

  // AC11: "Inspector (double-click a working unit)" (§5: double-click unit opens Inspector).
  await unitById(page, unitId).dblclick();
  const inspector = page.locator(SEL.inspector).first();
  await expect(inspector).toBeVisible();

  // AC11: "shows a growing message/tool-call transcript" — content must grow as ticks stream
  // adapter events (§7: text_delta, tool_call_start, tool_result, …).
  await tick(page, 5);
  const initialLength = (await inspector.innerText()).length;
  let grew = false;
  for (let i = 0; i < 40 && !grew; i++) {
    await tick(page, 5);
    grew = (await inspector.innerText()).length > initialLength;
  }
  expect(grew, 'inspector transcript must grow while the unit works').toBe(true);
});
