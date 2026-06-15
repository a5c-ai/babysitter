/**
 * commands.spec.ts — SPEC §13: AC4 (dispatch order), AC5 (abort), microagent card contents (§8).
 * Deterministic: `/?seed=42`, sim paused on boot, time advanced only via tick(n) (SPEC §9, §13).
 */
import { expect, test } from '@playwright/test';
import {
  bootWarRoom,
  commandCell,
  countSvgLinkShapes,
  dispatchIdleUnitToTask,
  SEL,
  selectIdleUnit,
  selectionPanelText,
  taskById,
  tick,
  tickUntil,
  unitById,
} from '../helpers';

test('AC4: right-click dispatch assigns the selected idle unit to a task', async ({ page }) => {
  test.setTimeout(120_000);
  await bootWarRoom(page, { seed: 42 });

  const { unitId } = await selectIdleUnit(page);
  const tickerBefore = await page.locator(SEL.tickerItem).count();
  const linkShapesBefore = await countSvgLinkShapes(page);

  // §5: "Right-click task node with ≥1 unit selected: dispatch order"
  const task = page.locator(SEL.task).first();
  const taskId = (((await task.getAttribute('data-testid')) ?? '')).replace(/^task-/, '');
  expect(taskId).not.toBe('');
  await task.click({ button: 'right' });
  await tick(page, 3);

  // AC4: "unit's state leaves `idle`" (§5: becomes dispatching then thinking)
  await unitById(page, unitId).click();
  const leftIdle = await tickUntil(
    page,
    async () => {
      const text = await selectionPanelText(page);
      return text !== '' && !/\bidle\b/.test(text);
    },
    { chunk: 3, maxChunks: 30 },
  );
  expect(leftIdle, `unit ${unitId} must leave idle after the dispatch order`).toBe(true);

  // AC4: "a link line renders" (§4: SVG link layer draws unit↔assigned task lines)
  await expect.poll(() => countSvgLinkShapes(page)).toBeGreaterThan(linkShapesBefore);

  // AC4: "ticker logs the order"
  await expect.poll(() => page.locator(SEL.tickerItem).count()).toBeGreaterThan(tickerBefore);
  await expect(
    page.locator(SEL.tickerItem).filter({ hasText: /dispatch|order|assign/i }).first(),
  ).toBeVisible();

  // AC4: "task gains an assignee" — the task leaves `queued`
  // (§3 task states: queued → assigned → in_progress → review → done | failed),
  // and the task SelectionPanel shows details+assignees (§4).
  await taskById(page, taskId).click();
  const taskPanel = page.locator(SEL.selectionPanel).first();
  await expect(taskPanel).toBeVisible();
  await expect(taskPanel).toContainText(/assigned|in[_ ]?progress|review/i);
});

test('AC5: Abort on a working unit returns it to idle and logs the event', async ({ page }) => {
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
  expect(working, 'dispatched unit must reach a working state').toBe(true);

  // AC5: "`Abort` on a working unit returns it to `idle`"
  // (§8 unit-working commands: Steer…, Pause, Inspect, Abort)
  const abort = commandCell(page, /abort/i);
  await expect(abort).toBeVisible();
  await abort.click();
  const backToIdle = await tickUntil(
    page,
    async () => /\bidle\b/.test(await selectionPanelText(page)),
    { chunk: 3, maxChunks: 40 },
  );
  expect(backToIdle, 'aborted unit must return to idle').toBe(true);

  // AC5: "and logs the event" — the ticker records the abort.
  await expect(page.locator(SEL.tickerItem).filter({ hasText: /abort/i }).first()).toBeVisible();
});

test('§13 microagent card contents: global and idle-unit command sets match §8', async ({
  page,
}) => {
  await bootWarRoom(page, { seed: 42 });

  // §8 global (empty selection): "Select All Idle", "Jump to Alert", "Pause Sim"/"Resume Sim".
  await page.keyboard.press('Escape'); // ensure empty selection
  await expect(commandCell(page, /select all idle/i)).toBeVisible();
  await expect(commandCell(page, /jump to alert/i)).toBeVisible();
  await expect(commandCell(page, /pause sim|resume sim/i)).toBeVisible();
  // §8: "always ≤12" (3x4 grid, §4)
  expect(await page.locator(SEL.cmd).count()).toBeLessThanOrEqual(12);

  // §8 unit-idle: "Dispatch…", "Rally", "Clone", "Retire".
  await selectIdleUnit(page);
  await expect(commandCell(page, /dispatch/i)).toBeVisible();
  await expect(commandCell(page, /rally/i)).toBeVisible();
  await expect(commandCell(page, /clone/i)).toBeVisible();
  await expect(commandCell(page, /retire/i)).toBeVisible();
  expect(await page.locator(SEL.cmd).count()).toBeLessThanOrEqual(12);
});
