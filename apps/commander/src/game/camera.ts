/**
 * Camera math (SPEC §5, §6): pan/zoom with clamped bounds, zoom-toward-cursor.
 *
 * Coordinate model:
 *   screen = (world - camera) * zoom + viewportCenter
 * The camera {x, y} is the world point shown at the viewport center; zoom is
 * clamped to [ZOOM_MIN, ZOOM_MAX] and the camera center is clamped to the
 * world bounds. All functions are pure (unit-tested in __tests__/camera.test.ts).
 */

export interface Vec2 {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

/**
 * Zoom bounds. ZOOM_MIN is deliberately close to the boot zoom: zooming far
 * below it only manufactures dead map-floor around the world rect (the whole
 * battlefield already fits the viewport near 0.6).
 *
 * NOTE: DEFAULT_ZOOM is pinned by interaction geometry — at 1280x720 the
 * full content envelope (top task orbits down to world y≈48 through the
 * staging rows at y≈790) must sit between the 44px top bar and the bottom
 * HUD so every entity stays directly clickable. Above ~0.62 the topmost
 * task-orbit slots slide under the top bar. The minimap therefore renders
 * its camera rect with a clamped, always-visible sub-rect instead of
 * relying on a tighter default zoom.
 */
export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 2.5;
export const DEFAULT_ZOOM = 0.6;

/** Screen pixels moved per WASD/arrow key press (world delta = px / zoom). */
export const KEY_PAN_STEP_PX = 56;

/** Wheel deltaY → zoom factor exponent rate. */
export const WHEEL_ZOOM_RATE = 0.0015;

export function clampZoom(zoom: number): number {
  if (Number.isNaN(zoom)) return ZOOM_MIN;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
}

/**
 * Clamp the camera center inside the world rect (and zoom inside its bounds).
 * Returns the SAME reference when nothing changes (memo-friendliness).
 */
export function clampCamera(camera: CameraState, world: Size): CameraState {
  const zoom = clampZoom(camera.zoom);
  const x = Math.min(world.width, Math.max(0, camera.x));
  const y = Math.min(world.height, Math.max(0, camera.y));
  if (x === camera.x && y === camera.y && zoom === camera.zoom) return camera;
  return { x, y, zoom };
}

export function createDefaultCamera(world: Size): CameraState {
  return { x: world.width / 2, y: world.height / 2, zoom: DEFAULT_ZOOM };
}

export function worldToScreen(point: Vec2, camera: CameraState, viewport: Size): Vec2 {
  return {
    x: (point.x - camera.x) * camera.zoom + viewport.width / 2,
    y: (point.y - camera.y) * camera.zoom + viewport.height / 2,
  };
}

export function screenToWorld(point: Vec2, camera: CameraState, viewport: Size): Vec2 {
  return {
    x: (point.x - viewport.width / 2) / camera.zoom + camera.x,
    y: (point.y - viewport.height / 2) / camera.zoom + camera.y,
  };
}

/** Pan by a screen-space delta (drag / key step). World delta scales by 1/zoom. */
export function panByScreen(
  camera: CameraState,
  dxScreen: number,
  dyScreen: number,
  world: Size,
): CameraState {
  return clampCamera(
    {
      x: camera.x + dxScreen / camera.zoom,
      y: camera.y + dyScreen / camera.zoom,
      zoom: camera.zoom,
    },
    world,
  );
}

/**
 * Wheel zoom toward the cursor: the world point under `screenPoint` stays put.
 * When the zoom is already clamped at a bound, the camera is returned
 * unchanged (AC9: zoom is clamped — repeated wheel events are no-ops).
 */
export function zoomAtPoint(
  camera: CameraState,
  screenPoint: Vec2,
  deltaY: number,
  viewport: Size,
  world: Size,
): CameraState {
  const nextZoom = clampZoom(camera.zoom * Math.exp(-deltaY * WHEEL_ZOOM_RATE));
  if (nextZoom === camera.zoom) return camera;
  const anchor = screenToWorld(screenPoint, camera, viewport);
  return clampCamera(
    {
      x: anchor.x - (screenPoint.x - viewport.width / 2) / nextZoom,
      y: anchor.y - (screenPoint.y - viewport.height / 2) / nextZoom,
      zoom: nextZoom,
    },
    world,
  );
}

/** Center the camera on a world point, preserving zoom. */
export function centerOn(camera: CameraState, point: Vec2, world: Size): CameraState {
  return clampCamera({ x: point.x, y: point.y, zoom: camera.zoom }, world);
}
