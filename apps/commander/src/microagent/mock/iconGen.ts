/**
 * Procedural icon generation v2 (SPEC §8 + SPEC-V2 §V2-1): hash entity id →
 * whimsical clockwork creature — gear-and-boiler bodies, brass limbs and
 * antennae, stained-glass wing/shell panels and expressive eyes on a
 * porcelain face plate (the mechanical-dragonfly / walking-teapot spirit).
 * The palette is keyed by adapter faction as jewel stained-glass over brass:
 * claude-code=verdigris teal glass, codex=garnet glass, gemini-cli=amber
 * glass, pi=peridot glass. Tasks are brass-ringed wax-seal badges with an
 * embossed taskKind glyph.
 *
 * Determinism: pure string assembly from FNV-1a hashes of the entity id —
 * same id ⇒ byte-identical SVG (AC12/AC24, unit-tested). Expressions are
 * static per id; unit STATE is conveyed by the sprite ring, never by the
 * portrait.
 *
 * Shape policy: paths/circles/ellipses/rects only — no <line>/<polyline>
 * (the frozen e2e suite counts those document-wide as link-layer shapes)
 * and no <text> (crispness at 24–64px must not depend on font rendering).
 */

import { hashString } from '../../backend/mock/prng';
import type { IconContext, IconSpec } from '../types';

/**
 * Faction palettes (§V2-1): [glass, body, light, deep, glow].
 * glass = jewel stained-glass accent (wings/shell/gems, HUD accents) ·
 * body = brass fill · light = porcelain/parchment plate · deep = umber ink
 * outlines · glow = warm amber lamp highlights.
 */
const FACTION_PALETTES: Record<string, readonly [string, string, string, string, string]> = {
  'claude-code': ['#2f8d80', '#c39b4e', '#f3e7c5', '#3a2e18', '#e8b54a'],
  codex: ['#a93e4c', '#c39b4e', '#f3e7c5', '#3a2e18', '#e8b54a'],
  'gemini-cli': ['#cd8a1f', '#c39b4e', '#f3e7c5', '#3a2e18', '#e8b54a'],
  pi: ['#7f9b2e', '#c39b4e', '#f3e7c5', '#3a2e18', '#e8b54a'],
};

const DEFAULT_PALETTE: readonly [string, string, string, string, string] = [
  '#8a7a5c',
  '#ab9263',
  '#efe2c0',
  '#3a2e18',
  '#d9b25f',
];

/** Task wax palettes: [accent (jewel light), body (wax deep), light (parchment)]. */
const TASK_PALETTES: ReadonlyArray<readonly [string, string, string]> = [
  ['#d98e7a', '#7c2b30', '#f3e7c5'],
  ['#7cc4b2', '#1f5a50', '#f3e7c5'],
  ['#e3b765', '#8a5a14', '#f3e7c5'],
  ['#b9c873', '#4f6020', '#f3e7c5'],
  ['#9aa9c9', '#2e3f5c', '#f3e7c5'],
  ['#c79ab8', '#5e2f4f', '#f3e7c5'],
];

/** Brass ring constants for the wax-seal task badges. */
const BRASS = '#c39b4e';
const BRASS_LIGHT = '#e3c87f';
const BRASS_DEEP = '#6d5120';

const iconCache = new Map<string, IconSpec>();

export function generateIcon(ctx: IconContext): IconSpec {
  const cacheKey = `${ctx.kind}|${ctx.entityId}|${ctx.adapter ?? ''}|${ctx.taskKind ?? ''}`;
  const cached = iconCache.get(cacheKey);
  if (cached !== undefined) return cached;
  const spec = ctx.kind === 'unit' ? unitIcon(ctx) : taskIcon(ctx);
  iconCache.set(cacheKey, spec);
  return spec;
}

function svgOpen(): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" ` +
    `width="100%" height="100%" aria-hidden="true">`
  );
}

/** Clockwork gear: dashed tooth ring + brass disc + hub (circles only). */
function gearAt(cx: number, cy: number, r: number, body: string, deep: string, hub?: string): string {
  return (
    `<circle cx="${cx}" cy="${cy}" r="${(r * 1.25).toFixed(2)}" fill="none" stroke="${body}" ` +
    `stroke-width="${(r * 0.55).toFixed(2)}" stroke-dasharray="${(r * 0.58).toFixed(2)} ${(r * 0.5).toFixed(2)}"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${body}" stroke="${deep}" stroke-width="1.5"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${(r * 0.4).toFixed(2)}" fill="${hub ?? deep}"/>`
  );
}

// ---------------------------------------------------------------------------
// Unit avatars: whimsical clockwork creatures (§V2-1)
// ---------------------------------------------------------------------------

function unitIcon(ctx: IconContext): IconSpec {
  const palette = FACTION_PALETTES[ctx.adapter ?? ''] ?? DEFAULT_PALETTE;
  const [glass, body, light, deep, glow] = palette;
  const h = hashString(`unit:${ctx.entityId}`);
  const h2 = hashString(`cog:${ctx.entityId}`);

  // Static per-id trait wheel (expression never changes with state — SPEC §8).
  const bodyVariant = h % 5;
  const crestVariant = (h >>> 3) % 4;
  const eyeVariant = (h >>> 6) % 4;
  const mouthVariant = (h >>> 9) % 3;
  const wingVariant = (h >>> 12) % 3;
  const legVariant = (h >>> 15) % 2;
  const cheeks = (h >>> 17) % 2 === 0;
  const emblem = (h >>> 18) % 2 === 0;
  const eyeGap = 7 + (h2 % 4); // 7..10
  const eyeDy = ((h2 >>> 3) % 5) - 2; // -2..2
  const markX = 23 + ((h2 >>> 6) % 18); // 23..40 — maker's-mark rivet

  const cx = 32;
  const eyeY = 34 + eyeDy;
  const mouthY = eyeY + 8;

  // Ground shadow keeps the little contraption anchored at any render size.
  const shadow = `<ellipse cx="${cx}" cy="57.5" rx="13" ry="2.4" fill="${deep}" opacity="0.3"/>`;

  // Brass undercarriage (drawn first; the boiler overlaps the joints).
  let legs = '';
  if (legVariant === 0) {
    legs =
      `<path d="M26 52 V58 M38 52 V58" fill="none" stroke="${deep}" stroke-width="2.4" stroke-linecap="round"/>` +
      `<ellipse cx="26" cy="58.2" rx="2.6" ry="1.3" fill="${deep}"/>` +
      `<ellipse cx="38" cy="58.2" rx="2.6" ry="1.3" fill="${deep}"/>`;
  } else {
    legs =
      `<circle cx="25" cy="56.5" r="2.7" fill="${deep}"/>` +
      `<circle cx="39" cy="56.5" r="2.7" fill="${deep}"/>` +
      `<circle cx="25" cy="56.5" r="1" fill="${body}"/>` +
      `<circle cx="39" cy="56.5" r="1" fill="${body}"/>`;
  }

  // Stained-glass wings / shell panels / side gears (behind the body).
  let wings = '';
  if (wingVariant === 0) {
    wings =
      `<ellipse cx="14.5" cy="27.5" rx="10.5" ry="3.9" transform="rotate(-32 14.5 27.5)" fill="${glass}" opacity="0.62" stroke="${deep}" stroke-width="0.9"/>` +
      `<ellipse cx="49.5" cy="27.5" rx="10.5" ry="3.9" transform="rotate(32 49.5 27.5)" fill="${glass}" opacity="0.62" stroke="${deep}" stroke-width="0.9"/>` +
      `<ellipse cx="15.5" cy="33.5" rx="8.5" ry="3.2" transform="rotate(-12 15.5 33.5)" fill="${glass}" opacity="0.42" stroke="${deep}" stroke-width="0.8"/>` +
      `<ellipse cx="48.5" cy="33.5" rx="8.5" ry="3.2" transform="rotate(12 48.5 33.5)" fill="${glass}" opacity="0.42" stroke="${deep}" stroke-width="0.8"/>`;
  } else if (wingVariant === 1) {
    wings = gearAt(13.5, 36, 4.2, body, deep) + gearAt(50.5, 36, 4.2, body, deep);
  } else {
    wings =
      `<path d="M16 30 L8.5 26 L12 38 Z" fill="${glass}" opacity="0.72" stroke="${deep}" stroke-width="0.9" stroke-linejoin="round"/>` +
      `<path d="M48 30 L55.5 26 L52 38 Z" fill="${glass}" opacity="0.72" stroke="${deep}" stroke-width="0.9" stroke-linejoin="round"/>`;
  }

  // Crown-works: antenna, top gear, winding key or twin amber beads.
  let crest = '';
  switch (crestVariant) {
    case 0: // antenna with amber lamp-bulb
      crest =
        `<path d="M32 19 V9" fill="none" stroke="${deep}" stroke-width="2.2" stroke-linecap="round"/>` +
        `<circle cx="32" cy="7.5" r="2.8" fill="${glow}" stroke="${deep}" stroke-width="1"/>`;
      break;
    case 1: // crown gear
      crest = gearAt(32, 13, 4.6, body, deep, glow);
      break;
    case 2: // winding key
      crest =
        `<path d="M32 19 V12" fill="none" stroke="${deep}" stroke-width="2.2" stroke-linecap="round"/>` +
        `<circle cx="28.8" cy="9.5" r="3.1" fill="none" stroke="${deep}" stroke-width="2"/>` +
        `<circle cx="35.2" cy="9.5" r="3.1" fill="none" stroke="${deep}" stroke-width="2"/>`;
      break;
    default: // twin brass nubs with amber beads
      crest =
        `<path d="M24 19 V15 M40 19 V15" fill="none" stroke="${deep}" stroke-width="2.2" stroke-linecap="round"/>` +
        `<circle cx="24" cy="13.5" r="2.3" fill="${glow}" stroke="${deep}" stroke-width="0.9"/>` +
        `<circle cx="40" cy="13.5" r="2.3" fill="${glow}" stroke="${deep}" stroke-width="0.9"/>`;
      break;
  }

  // Boiler bodies — brass with umber ink outlines, riveted.
  let bodyShape = '';
  switch (bodyVariant) {
    case 0: // round boiler with a seam band
      bodyShape =
        `<circle cx="${cx}" cy="37" r="18" fill="${body}" stroke="${deep}" stroke-width="2.5"/>` +
        `<rect x="16" y="30" width="32" height="4" rx="2" fill="${deep}" opacity="0.18"/>`;
      break;
    case 1: // walking teapot: lid, kettle, spout and handle
      bodyShape =
        `<path d="M16 34 Q9 34 10.5 41 Q11.5 45.5 17 45.5" fill="none" stroke="${deep}" stroke-width="2.2" stroke-linecap="round"/>` +
        `<path d="M48 34 Q57 32 57 25 Q53 29 47 29 Z" fill="${body}" stroke="${deep}" stroke-width="1.5" stroke-linejoin="round"/>` +
        `<rect x="15" y="22" width="34" height="33" rx="13" fill="${body}" stroke="${deep}" stroke-width="2.5"/>` +
        `<ellipse cx="${cx}" cy="22.5" rx="10" ry="3" fill="${body}" stroke="${deep}" stroke-width="1.5"/>`;
      break;
    case 2: // shield-back beetle boiler
      bodyShape =
        `<path d="M32 17 Q47 23 47 37 Q47 50 32 55 Q17 50 17 37 Q17 23 32 17 Z" ` +
        `fill="${body}" stroke="${deep}" stroke-width="2.5" stroke-linejoin="round"/>`;
      break;
    case 3: // dome cogitator with a stained-glass dome band
      bodyShape =
        `<path d="M14 41 a18 21 0 1 1 36 0 a18 13 0 1 1 -36 0 Z" ` +
        `fill="${body}" stroke="${deep}" stroke-width="2.5"/>` +
        `<ellipse cx="${cx}" cy="26" rx="13" ry="6" fill="${glass}" opacity="0.38"/>`;
      break;
    default: // samovar capsule with girdle bands
      bodyShape =
        `<rect x="17" y="17" width="30" height="39" rx="15" fill="${body}" stroke="${deep}" stroke-width="2.5"/>` +
        `<rect x="18.5" y="24" width="27" height="3" rx="1.5" fill="${deep}" opacity="0.15"/>`;
      break;
  }

  // Hull rivets + per-id maker's mark.
  const rivets =
    `<circle cx="20.5" cy="48" r="0.9" fill="${light}" opacity="0.75"/>` +
    `<circle cx="43.5" cy="48" r="0.9" fill="${light}" opacity="0.75"/>` +
    `<circle cx="${markX}" cy="52" r="0.8" fill="${deep}" opacity="0.85"/>`;

  // Porcelain face plate — the hand-inked face sits on parchment enamel.
  const facePlate =
    `<ellipse cx="${cx}" cy="${eyeY + 2}" rx="12.5" ry="10.5" fill="${light}" ` +
    `stroke="${deep}" stroke-width="1.2"/>`;

  let eyes = '';
  const lx = cx - eyeGap;
  const rx = cx + eyeGap;
  switch (eyeVariant) {
    case 0: // round enamel eyes, inked rims, glass-dark pupils + sparkle
      eyes =
        `<circle cx="${lx}" cy="${eyeY}" r="4.1" fill="${light}" stroke="${deep}" stroke-width="1.5"/>` +
        `<circle cx="${rx}" cy="${eyeY}" r="4.1" fill="${light}" stroke="${deep}" stroke-width="1.5"/>` +
        `<circle cx="${lx + 0.8}" cy="${eyeY + 0.5}" r="1.8" fill="${deep}"/>` +
        `<circle cx="${rx + 0.8}" cy="${eyeY + 0.5}" r="1.8" fill="${deep}"/>` +
        `<circle cx="${lx - 1.3}" cy="${eyeY - 1.4}" r="0.8" fill="${light}"/>` +
        `<circle cx="${rx - 1.3}" cy="${eyeY - 1.4}" r="0.8" fill="${light}"/>`;
      break;
    case 1: // big ink-drop anime eyes with glass glints
      eyes =
        `<ellipse cx="${lx}" cy="${eyeY}" rx="3.3" ry="4.5" fill="${deep}"/>` +
        `<ellipse cx="${rx}" cy="${eyeY}" rx="3.3" ry="4.5" fill="${deep}"/>` +
        `<circle cx="${lx - 1}" cy="${eyeY - 1.6}" r="1" fill="${light}"/>` +
        `<circle cx="${rx - 1}" cy="${eyeY - 1.6}" r="1" fill="${light}"/>` +
        `<circle cx="${lx + 0.9}" cy="${eyeY + 1.6}" r="0.8" fill="${glass}"/>` +
        `<circle cx="${rx + 0.9}" cy="${eyeY + 1.6}" r="0.8" fill="${glass}"/>`;
      break;
    case 2: // happy closed arcs (^ ^), inked
      eyes =
        `<path d="M${lx - 3.6} ${eyeY + 1.6} Q${lx} ${eyeY - 3.4} ${lx + 3.6} ${eyeY + 1.6}" ` +
        `fill="none" stroke="${deep}" stroke-width="2.3" stroke-linecap="round"/>` +
        `<path d="M${rx - 3.6} ${eyeY + 1.6} Q${rx} ${eyeY - 3.4} ${rx + 3.6} ${eyeY + 1.6}" ` +
        `fill="none" stroke="${deep}" stroke-width="2.3" stroke-linecap="round"/>`;
      break;
    default: // brass monocle on the left, button eye on the right
      eyes =
        `<circle cx="${lx}" cy="${eyeY}" r="5.6" fill="none" stroke="${body}" stroke-width="1.5"/>` +
        `<circle cx="${lx}" cy="${eyeY}" r="4" fill="${light}" stroke="${deep}" stroke-width="1.4"/>` +
        `<circle cx="${lx + 0.7}" cy="${eyeY + 0.4}" r="1.8" fill="${deep}"/>` +
        `<path d="M${lx + 4.4} ${eyeY + 3.6} Q${lx + 7} ${eyeY + 7} ${lx + 5.6} ${eyeY + 10}" ` +
        `fill="none" stroke="${body}" stroke-width="1.1"/>` +
        `<circle cx="${rx}" cy="${eyeY}" r="2.1" fill="${deep}"/>` +
        `<circle cx="${rx - 0.8}" cy="${eyeY - 0.8}" r="0.7" fill="${light}"/>`;
      break;
  }

  let mouth = '';
  switch (mouthVariant) {
    case 0: // smile
      mouth =
        `<path d="M${cx - 3.5} ${mouthY} a3.5 2.8 0 0 0 7 0" fill="none" ` +
        `stroke="${deep}" stroke-width="1.7" stroke-linecap="round"/>`;
      break;
    case 1: // tiny "o" (gently astonished)
      mouth = `<circle cx="${cx}" cy="${mouthY + 0.5}" r="1.5" fill="${deep}" opacity="0.9"/>`;
      break;
    default: // content flat
      mouth =
        `<path d="M${cx - 3} ${mouthY + 0.5} h6" fill="none" ` +
        `stroke="${deep}" stroke-width="1.7" stroke-linecap="round"/>`;
      break;
  }

  const cheeksMark = cheeks
    ? `<circle cx="${lx - 2.5}" cy="${eyeY + 5.5}" r="1.8" fill="${glow}" opacity="0.55"/>` +
      `<circle cx="${rx + 2.5}" cy="${eyeY + 5.5}" r="1.8" fill="${glow}" opacity="0.55"/>`
    : '';

  const emblemMark = emblem
    ? `<circle cx="${cx}" cy="${mouthY + 7.5}" r="2" fill="${glass}" stroke="${deep}" stroke-width="0.8" opacity="0.9"/>`
    : '';

  const svg =
    svgOpen() +
    shadow +
    legs +
    wings +
    crest +
    bodyShape +
    rivets +
    facePlate +
    eyes +
    cheeksMark +
    mouth +
    emblemMark +
    `</svg>`;

  return { svg, palette: [...palette] };
}

// ---------------------------------------------------------------------------
// Task structures: brass-ringed wax-seal badges (§V2-1)
// ---------------------------------------------------------------------------

/** Path-only glyphs per taskKind (centered on 32,32 in a ~22px box). */
function taskGlyph(kind: string, accent: string, body: string, light: string): string {
  const stroke = (d: string, w = 2.4): string =>
    `<path d="${d}" fill="none" stroke="${light}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  switch (kind) {
    case 'ci-repair': // gear
      return (
        `<circle cx="32" cy="32" r="5" fill="none" stroke="${light}" stroke-width="2.4"/>` +
        stroke(
          'M32 21.5 V25 M32 39 V42.5 M21.5 32 H25 M39 32 H42.5 M24.6 24.6 L27 27 M37 37 L39.4 39.4 M39.4 24.6 L37 27 M27 37 L24.6 39.4',
          2.2,
        )
      );
    case 'feature-dev': // spark
      return `<path d="M32 21 L34.7 29.3 L43 32 L34.7 34.7 L32 43 L29.3 34.7 L21 32 L29.3 29.3 Z" fill="${light}"/>`;
    case 'code-review': // magnifier
      return (
        `<circle cx="29.5" cy="29.5" r="6.5" fill="none" stroke="${light}" stroke-width="2.4"/>` +
        stroke('M34.5 34.5 L41 41')
      );
    case 'bug-fix': // bug
      return (
        stroke('M25.5 28.5 L21.5 26 M25.5 33.5 H21 M25.5 38.5 L21.5 41 M38.5 28.5 L42.5 26 M38.5 33.5 H43 M38.5 38.5 L42.5 41', 2) +
        `<circle cx="32" cy="24.5" r="3.2" fill="${light}"/>` +
        `<ellipse cx="32" cy="34" rx="6" ry="7.5" fill="${light}"/>` +
        `<path d="M32 27.5 V40.5" fill="none" stroke="${body}" stroke-width="1.6"/>`
      );
    case 'refactor': // cycle arrows
      return (
        stroke('M39.5 26.5 a9.5 9.5 0 0 0 -15.5 3.5') +
        stroke('M22.7 25.7 L23.6 31.3 L29 30') +
        stroke('M24.5 37.5 a9.5 9.5 0 0 0 15.5 -3.5') +
        stroke('M41.3 38.3 L40.4 32.7 L35 34')
      );
    case 'docs': // document with folded corner
      return (
        stroke('M25 20.5 H35 L40 25.5 V43.5 H25 Z', 2.2) +
        stroke('M35 20.5 V25.5 H40', 1.8) +
        stroke('M28.5 31 H36.5 M28.5 36 H36.5', 2)
      );
    case 'test-coverage': // shield + check
      return (
        stroke('M32 20.5 L41.5 24 V32 Q41.5 40.5 32 44.5 Q22.5 40.5 22.5 32 V24 Z', 2.2) +
        stroke('M27.5 32.5 L31 36 L37 27.5')
      );
    case 'perf-tuning': // bolt
      return `<path d="M34.5 20.5 L24.5 34 H31 L29.5 43.5 L39.5 30 H33 Z" fill="${light}"/>`;
    case 'security-audit': // padlock
      return (
        stroke('M27 29 V26.5 a5 5 0 0 1 10 0 V29') +
        `<rect x="24.5" y="29" width="15" height="12.5" rx="3" fill="${light}"/>` +
        `<circle cx="32" cy="34" r="1.8" fill="${body}"/>` +
        `<path d="M32 34 V38" fill="none" stroke="${body}" stroke-width="1.8" stroke-linecap="round"/>`
      );
    case 'release-prep': // rocket
      return (
        `<path d="M32 19.5 Q37.5 25.5 37.5 33 L37.5 38 H26.5 L26.5 33 Q26.5 25.5 32 19.5 Z" fill="${light}"/>` +
        `<circle cx="32" cy="30" r="2.4" fill="${body}"/>` +
        `<path d="M26.5 33.5 L22 40 L26.5 38.7 Z" fill="${light}"/>` +
        `<path d="M37.5 33.5 L42 40 L37.5 38.7 Z" fill="${light}"/>` +
        `<path d="M30 40.5 Q32 44.5 34 40.5" fill="none" stroke="${accent}" stroke-width="2.2" stroke-linecap="round"/>`
      );
    default: // diamond fallback
      return stroke('M32 22 L42 32 L32 42 L22 32 Z', 2.4);
  }
}

/** Wax-drip bumps (8 stations around the seal rim, radius ~19). */
const DRIP_POSITIONS: ReadonlyArray<readonly [number, number]> = [
  [51, 32],
  [45.4, 45.4],
  [32, 51],
  [18.6, 45.4],
  [13, 32],
  [18.6, 18.6],
  [32, 13],
  [45.4, 18.6],
];

/** Brass-ring pip stations (radius ~21). */
const PIP_POSITIONS: ReadonlyArray<readonly [number, number]> = [
  [53, 32],
  [46.9, 46.9],
  [32, 53],
  [17.1, 46.9],
  [11, 32],
  [17.1, 17.1],
  [32, 11],
  [46.9, 17.1],
];

function taskIcon(ctx: IconContext): IconSpec {
  const kind = ctx.taskKind ?? 'task';
  const palette = TASK_PALETTES[hashString(`kind:${kind}`) % TASK_PALETTES.length] ?? TASK_PALETTES[0]!;
  const [accent, body, light] = palette;
  const h = hashString(`task:${ctx.entityId}`);
  const drip = DRIP_POSITIONS[h % DRIP_POSITIONS.length] ?? DRIP_POSITIONS[0]!;
  const pip = PIP_POSITIONS[(h >>> 4) % PIP_POSITIONS.length] ?? PIP_POSITIONS[0]!;

  const svg =
    svgOpen() +
    // toothed brass outer rim (gear-ring) + main brass annulus
    `<circle cx="32" cy="32" r="26" fill="none" stroke="${BRASS_LIGHT}" stroke-width="2.6" stroke-dasharray="4.2 3.4"/>` +
    `<circle cx="32" cy="32" r="23" fill="${BRASS}" stroke="${BRASS_DEEP}" stroke-width="1.6"/>` +
    // compass rivets struck into the ring
    `<circle cx="32" cy="11.5" r="1.2" fill="${BRASS_DEEP}"/>` +
    `<circle cx="52.5" cy="32" r="1.2" fill="${BRASS_DEEP}"/>` +
    `<circle cx="32" cy="52.5" r="1.2" fill="${BRASS_DEEP}"/>` +
    `<circle cx="11.5" cy="32" r="1.2" fill="${BRASS_DEEP}"/>` +
    // per-id brass pip
    `<circle cx="${pip[0]}" cy="${pip[1]}" r="1" fill="${BRASS_LIGHT}" opacity="0.9"/>` +
    // wax disc with a per-id drip bump, gloss and embossed inner ring
    `<circle cx="${drip[0]}" cy="${drip[1]}" r="2.6" fill="${body}"/>` +
    `<circle cx="32" cy="32" r="17.5" fill="${body}" stroke="${BRASS_DEEP}" stroke-width="0.8"/>` +
    `<ellipse cx="26" cy="25.5" rx="6.5" ry="4" fill="${light}" opacity="0.18"/>` +
    `<circle cx="32" cy="32" r="13.5" fill="none" stroke="${light}" stroke-width="1" opacity="0.3"/>` +
    taskGlyph(kind, accent, body, light) +
    `</svg>`;

  return { svg, palette: [...palette] };
}

/** Faction accent color for an adapter (HUD chrome, link lines, minimap dots). */
export function factionAccent(adapter: string): string {
  return (FACTION_PALETTES[adapter] ?? DEFAULT_PALETTE)[0];
}
