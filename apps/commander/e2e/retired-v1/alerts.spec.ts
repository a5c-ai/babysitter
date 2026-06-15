/**
 * alerts.spec.ts — SPEC §13: AC6 (hook.request → AlertBanner/ping/⚠/Approve) and space-jump (§5).
 * Deterministic: `/?seed=42`, sim paused on boot, time advanced only via tick(n) (SPEC §9, §13).
 */
import { expect, test } from '@playwright/test';
import {
  bootWarRoom,
  findEmptyMapPoint,
  getAlerts,
  getCamera,
  SEL,
  selectionPanelText,
  tick,
  tickUntil,
  unitById,
} from '../helpers';

test('AC6: hook.request shows AlertBanner and increments the alert counter; Approve resolves it and the unit resumes', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await bootWarRoom(page, { seed: 42 });

  const banner = page.locator(SEL.alertBanner).first();
  const baseline = (await getAlerts(page)).length;

  // AC6: "When a `hook.request` fires: AlertBanner appears" — §7: the sim emits occasional
  // hook.request frames; advance deterministic ticks until one fires.
  const fired = await tickUntil(
    page,
    async () =>
      (await getAlerts(page)).length > baseline ||
      (await banner.isVisible().catch(() => false)),
    { chunk: 10, maxChunks: 120 },
  );
  expect(fired, 'sim must emit a hook.request within bounded sim time (SPEC §7)').toBe(true);
  await expect(banner).toBeVisible();

  const alerts = await getAlerts(page);
  expect(alerts.length).toBeGreaterThan(0);
  const unitId = alerts[0]?.unitId;

  // AC6: "⚠ counter increments" — §4 top bar resources include pending alerts; its topbar-*
  // testid must identify itself (contains "alert") and show a non-zero count.
  const warnCounter = page.locator('[data-testid^="topbar-"][data-testid*="alert"]').first();
  await expect(warnCounter).toBeVisible();
  await expect(warnCounter).toContainText(/[1-9]/);

  // AC6: "clicking `Approve` resolves it (banner clears, unit resumes)" — §5: inline buttons
  // on the AlertBanner. Approve every pending alert so the banner fully clears.
  for (let i = 0; i < 10; i++) {
    const approve = banner.getByRole('button', { name: /approve/i }).first();
    if (!(await approve.isVisible().catch(() => false))) break;
    await approve.click();
    await tick(page, 2);
    if ((await getAlerts(page)).length === 0) break;
  }
  expect((await getAlerts(page)).length).toBe(0);
  await expect(banner).toBeHidden();

  // AC6: "unit resumes" — the unit named by the resolved alert leaves `awaiting_approval` (§3).
  expect(unitId, 'alert entries must carry unitId (SPEC §6 alerts slice)').toBeTruthy();
  if (unitId) {
    await unitById(page, unitId).click();
    const resumed = await tickUntil(
      page,
      async () => {
        const text = await selectionPanelText(page);
        return text !== '' && !/awaiting/.test(text);
      },
      { chunk: 3, maxChunks: 30 },
    );
    expect(resumed, 'approved unit must leave awaiting_approval').toBe(true);
  }
});

test.fixme('AC6: minimap shows a ping when a hook.request fires', async () => {
  // SPEC §12 AC6: "When a `hook.request` fires: AlertBanner appears, minimap shows a ping,
  // ⚠ counter increments; clicking `Approve` resolves it (banner clears, unit resumes)."
  //
  // The "minimap shows a ping" clause is not e2e-verifiable from the given contracts:
  // §9 defines no data-testid for individual pings, and §11 explicitly permits the minimap
  // to be a <canvas> ("canvas allowed ONLY for minimap"), where a ping leaves no DOM trace.
  // Verifying it would require a pixel-level or ping-testid contract the spec does not define.
  // The remaining AC6 clauses are covered by the test above.
});

test('AC6 (§5): Space jumps the camera to the most recent alert', async ({ page }) => {
  test.setTimeout(180_000);
  await bootWarRoom(page, { seed: 42 });

  const banner = page.locator(SEL.alertBanner).first();
  const fired = await tickUntil(
    page,
    async () =>
      (await getAlerts(page)).length > 0 || (await banner.isVisible().catch(() => false)),
    { chunk: 10, maxChunks: 120 },
  );
  expect(fired, 'an alert must exist before testing the space-jump').toBe(true);

  // Pan the camera far away so the jump is observable as a camera change.
  const empty = await findEmptyMapPoint(page);
  await page.mouse.click(empty.x, empty.y); // focus the map (clears selection — acceptable)
  for (let i = 0; i < 20; i++) await page.keyboard.press('ArrowRight');
  const before = await getCamera(page);

  // §5: "Space: jump camera to most recent alert (approval/failure)".
  await page.keyboard.press('Space');
  await expect
    .poll(async () => {
      const cam = await getCamera(page);
      return cam.x !== before.x || cam.y !== before.y;
    })
    .toBe(true);
});
