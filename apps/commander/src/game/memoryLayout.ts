/**
 * Deterministic layout for the Archive overlay graph (SPEC-V2 §V2-3 as
 * amended by SPEC-V4 §V4-10): records cluster BY SILO into distinct
 * rectangular sectors with clear gutters and on-canvas silo captions.
 * Pure: same records + silos ⇒ same positions, byte-stable. Edges render
 * as quadratic `<path>` curves (NEVER <line>/<polyline> — AC24/AC33 census
 * rule). Zoom/pan are VIEW state and live in archiveView.ts — never here.
 */

import type { GraphRecord } from '../contracts/kradle-memory';

export const MEMORY_VIEW = { width: 1200, height: 760 } as const;

/** Sector gutter width between silo clusters (§V4-10 "clear gutters"). */
const SECTOR_GUTTER = 34;
/** Headroom inside a sector reserved for its caption. */
const CAPTION_HEADROOM = 30;
/** Golden angle (radians) for the in-sector sunflower spiral. */
const GOLDEN_ANGLE = 2.399963229728653;

export interface MemoryNodePosition {
  id: string;
  nodeKind: string;
  /** Owning silo cluster (first silo holding the record; '' = unassigned). */
  silo: string;
  x: number;
  y: number;
}

export interface MemoryEdgePath {
  /** `<edgeKind>:<sourceId>-><targetId>` (unique, deterministic). */
  key: string;
  edgeKind: string;
  src: string;
  dst: string;
  d: string;
}

export interface SiloCaption {
  silo: string;
  /** Caption anchor (top-left inside the sector). */
  x: number;
  y: number;
  /** Sector bounds (for the etched sector plate). */
  rect: { x: number; y: number; width: number; height: number };
}

export interface MemoryLayout {
  nodes: MemoryNodePosition[];
  edges: MemoryEdgePath[];
  /** nodeKinds present, sorted (filter chip order). */
  kinds: string[];
  /** §V4-10 silo cluster captions, in silo order. */
  captions: SiloCaption[];
}

/** Minimal silo shape the layout needs (matches SimMemorySiloView). */
export interface SiloAssignment {
  name: string;
  recordIds: readonly string[];
}

/** Sanitize a record id for testids (§V2-3: ':' → '-'). */
export function sanitizeNodeId(id: string): string {
  return id.replace(/:/g, '-');
}

/**
 * nodeKind → stable hue, quantized to the four faction stained-glass tints
 * (§V2-1): verdigris teal · garnet · amber · peridot.
 */
const GLASS_HUES: readonly number[] = [168, 352, 42, 75];

export function kindHue(kind: string): number {
  let h = 0;
  for (let i = 0; i < kind.length; i += 1) {
    h = (h * 31 + kind.charCodeAt(i)) >>> 0;
  }
  return GLASS_HUES[h % GLASS_HUES.length] ?? 42;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Quadratic curve between two points, bowed toward the plate center. */
export function edgePath(
  from: { x: number; y: number },
  to: { x: number; y: number },
): string {
  const cx = MEMORY_VIEW.width / 2;
  const cy = MEMORY_VIEW.height / 2;
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  // Pull the control point 22% toward the center for a gentle engraving bow.
  const qx = mx + (cx - mx) * 0.22;
  const qy = my + (cy - my) * 0.22;
  return `M ${round(from.x)} ${round(from.y)} Q ${round(qx)} ${round(qy)} ${round(to.x)} ${round(to.y)}`;
}

interface Sector {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Split the canvas into a grid of sectors with gutters, one per cluster. */
function sectorGrid(count: number): Sector[] {
  const cols = count <= 1 ? 1 : count <= 4 ? 2 : Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const cellW = (MEMORY_VIEW.width - SECTOR_GUTTER * (cols + 1)) / cols;
  const cellH = (MEMORY_VIEW.height - SECTOR_GUTTER * (rows + 1)) / rows;
  const sectors: Sector[] = [];
  for (let i = 0; i < count; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    sectors.push({
      x: SECTOR_GUTTER + col * (cellW + SECTOR_GUTTER),
      y: SECTOR_GUTTER + row * (cellH + SECTOR_GUTTER),
      width: cellW,
      height: cellH,
    });
  }
  return sectors;
}

/**
 * Silo-clustered deterministic layout (§V4-10). Each record lands in its
 * FIRST owning silo's sector (replicated records are drawn once); records
 * without a silo gather in a trailing "archive" sector. Inside a sector the
 * records (sorted by id) fan out on a sunflower spiral around the sector
 * center — dense, gutter-respecting, and byte-stable per input.
 *
 * Backwards-compatible: with no silos every record clusters into one
 * full-canvas sector (the pre-V4 unit-test contract still holds).
 */
export function computeMemoryLayout(
  records: readonly GraphRecord[],
  silos: readonly SiloAssignment[] = [],
): MemoryLayout {
  const kinds = [...new Set(records.map((r) => r.nodeKind))].sort();

  // record → first owning silo (silo declaration order).
  const siloOf = new Map<string, string>();
  for (const silo of silos) {
    for (const id of silo.recordIds) {
      if (!siloOf.has(id)) siloOf.set(id, silo.name);
    }
  }

  const clusterNames: string[] = silos.map((s) => s.name);
  const unassigned = records.filter((r) => !siloOf.has(r.id));
  if (clusterNames.length === 0 || unassigned.length > 0) {
    const fallback = clusterNames.length === 0 ? '' : 'archive';
    clusterNames.push(fallback);
    for (const record of unassigned) siloOf.set(record.id, fallback);
    if (clusterNames.length === 1 && fallback === '') {
      for (const record of records) siloOf.set(record.id, '');
    }
  }

  const members = new Map<string, GraphRecord[]>(clusterNames.map((name) => [name, []]));
  const sortedRecords = [...records].sort((a, b) => (a.id < b.id ? -1 : 1));
  for (const record of sortedRecords) {
    members.get(siloOf.get(record.id) ?? clusterNames[clusterNames.length - 1]!)?.push(record);
  }

  const sectors = sectorGrid(clusterNames.length);
  const nodes: MemoryNodePosition[] = [];
  const positions = new Map<string, MemoryNodePosition>();
  const captions: SiloCaption[] = [];

  clusterNames.forEach((silo, clusterIndex) => {
    const sector = sectors[clusterIndex]!;
    if (silo !== '') {
      captions.push({
        silo,
        x: round(sector.x + 14),
        y: round(sector.y + 20),
        rect: {
          x: round(sector.x),
          y: round(sector.y),
          width: round(sector.width),
          height: round(sector.height),
        },
      });
    }
    const list = members.get(silo) ?? [];
    const cx = sector.x + sector.width / 2;
    const cy = sector.y + (sector.height + CAPTION_HEADROOM) / 2;
    const maxR =
      Math.min(sector.width, sector.height - CAPTION_HEADROOM) / 2 - 26;
    const denom = Math.sqrt(Math.max(1, list.length));
    list.forEach((record, i) => {
      const r = (Math.sqrt(i + 0.55) / denom) * maxR;
      const angle = i * GOLDEN_ANGLE;
      const node: MemoryNodePosition = {
        id: record.id,
        nodeKind: record.nodeKind,
        silo,
        x: round(cx + Math.cos(angle) * r),
        y: round(cy + Math.sin(angle) * r),
      };
      nodes.push(node);
      positions.set(record.id, node);
    });
  });

  const edges: MemoryEdgePath[] = [];
  for (const record of sortedRecords) {
    const from = positions.get(record.id);
    if (from === undefined || record.edges === undefined) continue;
    const edgesByKind = record.edges as Record<string, Array<{ target: string }> | undefined>;
    for (const edgeKind of Object.keys(edgesByKind).sort()) {
      for (const edge of edgesByKind[edgeKind] ?? []) {
        const to = positions.get(edge.target);
        if (to === undefined) continue;
        edges.push({
          key: `${edgeKind}:${record.id}->${edge.target}`,
          edgeKind,
          src: record.id,
          dst: edge.target,
          d: edgePath(from, to),
        });
      }
    }
  }

  return { nodes, edges, kinds, captions };
}
