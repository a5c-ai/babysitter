/**
 * camera.spec.ts — SPEC §13: AC7 (minimap jump), AC9 (wheel zoom + keyboard pan, clamped zoom).
 * Camera truth is read from the §6 store slice `camera: {x, y, zoom}` exposed via §9 hooks.
 * Deterministic: `/?seed=42`, sim paused on boot (SPEC §9, §13).
 */
import { expect, test } from '@playwright/test';
import { bootWarRoom, getCamera, SEL } from '../helpers';

test('AC7: minimap click recenters the camera', async ({ page }) => {
  await bootWarRoom(page, { seed: 42 });

  const minimap = page.locator(SEL.minimap).first();
  await expect(minimap).toBeVisible();
  const box = await minimap.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  // AC7: "Minimap click recenters the camera (viewport rect moves; world transform changes)"
  // (§5: minimap click jump). Clicking two distinct minimap points must yield two distinct
  // camera centers — the store camera is the source of the world transform (§6).
  await page.mouse.click(box.x + box.width * 0.2, box.y + box.height * 0.8);
  const camA = await getCamera(page);
  await page.mouse.click(box.x + box.width * 0.8, box.y + box.height * 0.2);
  const camB = await getCamera(page);
  expect(
    camA.x !== camB.x || camA.y !== camB.y,
    'clicking different minimap points must recenter the camera differently',
  ).toBe(true);
});

test('AC9: wheel zoom and keyboard pan change the camera; zoom is clamped', async ({ page }) => {
  await bootWarRoom(page, { seed: 42 });

  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  if (!viewport) return;
  // Hover mid-map (clear of top bar and bottom HUD) — §5: wheel zooms toward cursor.
  await page.mouse.move(viewport.width / 2, viewport.height * 0.45);

  const initial = await getCamera(page);

  // AC9: "Wheel zoom … change[s] the camera"
  await page.mouse.wheel(0, -240);
  await expect
    .poll(async () => (await getCamera(page)).zoom !== initial.zoom)
    .toBe(true);

  // AC9: "zoom is clamped" — zooming in past the bound stops changing the zoom level …
  for (let i = 0; i < 40; i++) await page.mouse.wheel(0, -240);
  const zoomMaxA = (await getCamera(page)).zoom;
  for (let i = 0; i < 5; i++) await page.mouse.wheel(0, -240);
  const zoomMaxB = (await getCamera(page)).zoom;
  expect(zoomMaxB, 'zoom must be clamped at an upper bound').toBe(zoomMaxA);

  // … and so does zooming out past the lower bound (§6: camera with clamped bounds).
  for (let i = 0; i < 80; i++) await page.mouse.wheel(0, 240);
  const zoomMinA = (await getCamera(page)).zoom;
  for (let i = 0; i < 5; i++) await page.mouse.wheel(0, 240);
  const zoomMinB = (await getCamera(page)).zoom;
  expect(zoomMinB, 'zoom must be clamped at a lower bound').toBe(zoomMinA);
  expect(zoomMaxA).toBeGreaterThan(zoomMinA);

  // AC9: "keyboard pan change[s] the camera" (§5: WASD/arrow pan).
  const beforePan = await getCamera(page);
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
  await expect
    .poll(async () => {
      const cam = await getCamera(page);
      return cam.x !== beforePan.x || cam.y !== beforePan.y;
    })
    .toBe(true);
});
