/**
 * Archive graph VIEW-STATE math (SPEC-V4 §V4-10): wheel zoom (clamped,
 * toward the cursor), drag pan, search filtering/highlighting and the
 * low-zoom edge-declutter predicate. All pure — the LAYOUT stays
 * seed-deterministic in memoryLayout.ts; zoom/pan/search never touch sim
 * state (AC44 "zoom/pan are view-only").
 */

import type { GraphRecord } from '../contracts/kradle-memory';

export interface ArchiveViewState {
  /** Zoom scale (clamped to [ARCHIVE_ZOOM_MIN, ARCHIVE_ZOOM_MAX]). */
  k: number;
  /** Pan translation in SVG user units (applied BEFORE the scale). */
  tx: number;
  ty: number;
}

export const ARCHIVE_ZOOM_MIN = 0.5;
export const ARCHIVE_ZOOM_MAX = 2.5;

/** The home view: identity transform (reset-view restores this, §V4-10). */
export const ARCHIVE_HOME_VIEW: ArchiveViewState = { k: 1, tx: 0, ty: 0 };

export function clampZoom(k: number): number {
  return Math.min(ARCHIVE_ZOOM_MAX, Math.max(ARCHIVE_ZOOM_MIN, k));
}

/** Multiplicative zoom step for a wheel delta (wheel-up = deltaY<0 = in). */
export function wheelZoomFactor(deltaY: number): number {
  return Math.pow(1.25, -deltaY / 120);
}

/**
 * Zoom by `factor` keeping the SVG-space `point` fixed under the cursor.
 * At the clamp boundary the view is returned unchanged (further wheel input
 * must not move the view — AC44 "clamped").
 */
export function zoomAt(
  view: ArchiveViewState,
  factor: number,
  point: { x: number; y: number },
): ArchiveViewState {
  const k = clampZoom(view.k * factor);
  if (k === view.k) return view;
  const ratio = k / view.k;
  return {
    k,
    tx: point.x - (point.x - view.tx) * ratio,
    ty: point.y - (point.y - view.ty) * ratio,
  };
}

/** Content bounding box of the laid-out graph (SVG user units). */
export interface ArchiveContentBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * v5-r0 (§V4-10 polish): bias the pan toward the CONTENT bounding-box
 * centroid when zoomed in. Under translate-then-scale (screen = t + k·p) a
 * deep zoom at a plate corner can carry the whole graph off-canvas; this
 * clamp pulls the translation back so the content centroid stays on the
 * plate, with the allowed band tightening as the zoom deepens (stronger
 * pull toward the content at higher k). View-only — never touches sim
 * state; at k ≤ 1 (or when no correction is needed) the SAME view object
 * is returned, preserving the AC44 "clamped wheel input does not move the
 * view" identity.
 */
export function clampPanToContent(
  view: ArchiveViewState,
  bounds: ArchiveContentBounds,
  viewWidth: number,
  viewHeight: number,
): ArchiveViewState {
  if (view.k <= 1) return view;
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  // Screen-space centroid under the current transform.
  const sx = view.tx + view.k * cx;
  const sy = view.ty + view.k * cy;
  // Zoom-in bias: 0 just past k=1, 1 at ARCHIVE_ZOOM_MAX. The centroid must
  // stay within an inset band of the plate; the inset grows with the bias.
  // 0.35 at full bias: the centroid is held within the central 30% of the
  // plate at max zoom, so the visible window always overlaps content sectors
  // (an 0.18 inset proved too lax — a corner deep-zoom could land the window
  // on an empty sector cell beside the centroid).
  const bias = Math.min(1, (view.k - 1) / (ARCHIVE_ZOOM_MAX - 1));
  const insetX = viewWidth * 0.35 * bias;
  const insetY = viewHeight * 0.35 * bias;
  const clampedX = Math.min(viewWidth - insetX, Math.max(insetX, sx));
  const clampedY = Math.min(viewHeight - insetY, Math.max(insetY, sy));
  if (clampedX === sx && clampedY === sy) return view;
  return { k: view.k, tx: view.tx + (clampedX - sx), ty: view.ty + (clampedY - sy) };
}

/** A cluster (silo) centroid — same coordinate space as the wheel point. */
export interface ArchiveClusterCentroid {
  x: number;
  y: number;
}

/**
 * v5-r1 (§V4-10 polish): dead-space radius (SVG user units). A wheel cursor
 * within this distance of a cluster centroid is honored EXACTLY; beyond it
 * the cursor sits in dead space and the focal point is biased.
 */
export const ARCHIVE_FOCAL_DEAD_RADIUS = 120;

/**
 * Maximum focal-bias pull (fraction of cursor→centroid). A FULL pin (1) in
 * deep dead space is required for convergence: each wheel notch expands the
 * view ×1.25 around the focal point, so any partial pull still lets the
 * cluster drift off-plate (1.25·(1−b)+b > 1 for every b < 1). Pinning the
 * nearest centroid keeps it fixed under repeated notches — the cluster
 * magnifies in place instead of vacating the plate.
 */
export const ARCHIVE_FOCAL_BIAS_MAX = 1;

/**
 * v5-r1: bias the zoom focal point toward the NEAREST cluster centroid when
 * the wheel cursor sits in dead space (no centroid within `radius`). The
 * pull ramps from 0 at the dead-space boundary to a full centroid pin at 2×
 * the radius, so a deep zoom from empty parchment magnifies the nearest
 * cluster instead of vacuum. Pure + view-only; when the cursor is near a
 * cluster (or no centroids exist) the SAME point object is returned, so
 * cursor-anchored zoom behavior (AC44) is untouched.
 */
export function biasFocalPoint(
  point: { x: number; y: number },
  centroids: readonly ArchiveClusterCentroid[],
  radius: number = ARCHIVE_FOCAL_DEAD_RADIUS,
): { x: number; y: number } {
  if (centroids.length === 0) return point;
  let nearest = centroids[0];
  let best = Math.hypot(nearest.x - point.x, nearest.y - point.y);
  for (let i = 1; i < centroids.length; i += 1) {
    const c = centroids[i];
    const d = Math.hypot(c.x - point.x, c.y - point.y);
    if (d < best) {
      best = d;
      nearest = c;
    }
  }
  if (best <= radius) return point;
  const t = Math.min(1, (best - radius) / radius) * ARCHIVE_FOCAL_BIAS_MAX;
  return {
    x: point.x + (nearest.x - point.x) * t,
    y: point.y + (nearest.y - point.y) * t,
  };
}

/** Pan by a delta in SVG user units. */
export function panBy(view: ArchiveViewState, dx: number, dy: number): ArchiveViewState {
  if (dx === 0 && dy === 0) return view;
  return { k: view.k, tx: view.tx + dx, ty: view.ty + dy };
}

export function isHomeView(view: ArchiveViewState): boolean {
  return view.k === 1 && view.tx === 0 && view.ty === 0;
}

/**
 * Map a client (pixel) coordinate into SVG user units for an svg element
 * rendered with the default `preserveAspectRatio` ("meet": uniform scale,
 * centered letterbox). Returns both the point and the uniform scale so pan
 * deltas can be converted exactly (1px of mouse = 1px of node shift).
 */
export function clientToSvg(
  rect: { left: number; top: number; width: number; height: number },
  clientX: number,
  clientY: number,
  viewWidth: number,
  viewHeight: number,
): { x: number; y: number; scale: number } {
  const scale = Math.min(rect.width / viewWidth, rect.height / viewHeight) || 1;
  const offsetX = (rect.width - viewWidth * scale) / 2;
  const offsetY = (rect.height - viewHeight * scale) / 2;
  return {
    x: (clientX - rect.left - offsetX) / scale,
    y: (clientY - rect.top - offsetY) / scale,
    scale,
  };
}

/** Normalize for search matching: lowercase, ':' folded to '-' (testid form). */
export function normalizeArchiveText(text: string): string {
  return text.toLowerCase().replace(/:/g, '-');
}

/**
 * §V4-10 search: match records by title OR id (case-insensitive; the testid
 * sanitization ':'→'-' is folded so fragments of `memory-node-*` ids match).
 * Empty/whitespace query ⇒ empty set (no filter active).
 */
export function searchArchive(
  records: ReadonlyArray<Pick<GraphRecord, 'id'> & { attributes: { title: string } }>,
  query: string,
): Set<string> {
  const q = normalizeArchiveText(query.trim());
  const matches = new Set<string>();
  if (q.length === 0) return matches;
  for (const record of records) {
    if (
      normalizeArchiveText(record.id).includes(q) ||
      normalizeArchiveText(record.attributes.title).includes(q)
    ) {
      matches.add(record.id);
    }
  }
  return matches;
}

/** Viewport-cull margin in SVG user units (a node just off-plate keeps its edges). */
export const ARCHIVE_CULL_MARGIN = 32;

/**
 * Is a layout node inside the visible plate under the current view
 * transform? (translate-then-scale: screen = t + k·p.) Used by the zoom>1
 * edge cull — declutter only, never selection.
 */
export function nodeInViewport(
  view: ArchiveViewState,
  x: number,
  y: number,
  viewWidth: number,
  viewHeight: number,
  margin: number = ARCHIVE_CULL_MARGIN,
): boolean {
  const sx = view.tx + view.k * x;
  const sy = view.ty + view.k * y;
  return sx >= -margin && sx <= viewWidth + margin && sy >= -margin && sy <= viewHeight + margin;
}

/**
 * §V4-10 edge declutter predicate (v4-r0 tightening):
 *   - edges incident to the focused/hovered node ALWAYS render;
 *   - otherwise only intra-cluster (same-silo) edges survive — at every
 *     zoom level (cross-silo hairlines were the main clutter source);
 *   - at zoom > 1, an intra-cluster edge whose BOTH endpoints sit outside
 *     the viewport is culled (`srcInView`/`dstInView` from nodeInViewport).
 */
export function edgeVisible(
  zoom: number,
  srcSilo: string,
  dstSilo: string,
  src: string,
  dst: string,
  activeIds: ReadonlyArray<string | null>,
  srcInView: boolean = true,
  dstInView: boolean = true,
): boolean {
  for (const active of activeIds) {
    if (active !== null && (src === active || dst === active)) return true;
  }
  if (srcSilo !== dstSilo) return false;
  if (zoom > 1 && !srcInView && !dstInView) return false;
  return true;
}
