/**
 * Shared engraved-brass glyph helpers (SPEC-V2 §V2-1 command glyph style):
 * tiny procedural SVGs, paths/circles/rects only — no <line>/<polyline>
 * (the frozen e2e suite counts those document-wide as link-layer shapes)
 * and no <text>. Pure string assembly ⇒ byte-identical per input.
 */

import type { IconSpec } from '../types';

/** Brass-line engraving stroke (§V2-1). */
export const GLYPH_STROKE = '#d8b561';
/** Garnet tint for danger-tone glyphs (§V3-5). */
export const GLYPH_DANGER = '#c25a5a';

export function glyph(paths: string, stroke: string = GLYPH_STROKE): IconSpec {
  return {
    svg:
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="100%" height="100%" aria-hidden="true">` +
      `<g fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</g>` +
      `</svg>`,
    palette: [stroke],
  };
}
