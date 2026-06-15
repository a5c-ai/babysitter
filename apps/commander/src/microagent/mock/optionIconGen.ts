/**
 * Inquiry-option icon generation (SPEC-V3 §V3-5): every InquiryOption gets a
 * microagent-generated engraved-brass glyph. The glyph is picked SEMANTICALLY
 * from keywords in the option's id/caption (strategy=fork, version=stacked
 * discs, approve=check-seal, reject=barred shield, test=flask, patch=stitched
 * plate, …) with a deterministic hash fallback when nothing matches. Danger
 * tone renders in the garnet tint. Pure + cached ⇒ same option ⇒
 * byte-identical SVG. Path-only (no <line>/<polyline>/<text>).
 *
 * Exported standalone so the Inquiry Dock (board phase) can call it per
 * option, and re-exported through `mockMicroagent.generateOptionIcon`.
 */

import { hashString } from '../../backend/mock/prng';
import type { IconSpec, InquiryOptionLike } from '../types';
import { glyph, GLYPH_DANGER, GLYPH_STROKE } from './glyphs';

/** Semantic glyph paths (drawn in a 20x20 viewBox, engraving stroke). */
const SEMANTIC_PATHS: ReadonlyArray<{ match: RegExp; paths: string }> = [
  // strategy / branching choices → fork
  {
    match: /strateg|branch|fork|route|path|approach|plan\b/,
    paths:
      '<path d="M10 17 V11 M10 11 Q10 7 5.5 6 M10 11 Q10 7 14.5 6"/>' +
      '<circle cx="5.5" cy="4.5" r="1.6"/><circle cx="14.5" cy="4.5" r="1.6"/><circle cx="10" cy="17" r="1.4"/>',
  },
  // dependency versions / pinning → stacked discs
  {
    match: /version|pin|upgrade|bump|depend|lts|latest|major|minor/,
    paths:
      '<ellipse cx="10" cy="5.5" rx="6" ry="2.2"/>' +
      '<path d="M4 5.5 V10 a6 2.2 0 0 0 12 0 V5.5 M4 10 V14.5 a6 2.2 0 0 0 12 0 V10"/>',
  },
  // approve / proceed / allow → check-seal
  {
    match: /approve|proceed|allow|accept|confirm|yes\b|adopt|go\b/,
    paths: '<circle cx="10" cy="10" r="7"/><path d="M6.5 10.5 L9 13 L13.8 7"/>',
  },
  // reject / stand-down / deny → barred shield
  {
    match: /reject|deny|stand[- ]?down|refuse|block|halt|abort|stop|no\b/,
    paths:
      '<path d="M10 3 L16 5.5 V10 Q16 15 10 17.5 Q4 15 4 10 V5.5 Z"/>' +
      '<path d="M6.5 12.5 L13.5 7.5"/>',
  },
  // tests / verification → flask
  {
    match: /test|suite|verif|validate|assert|check\b|parity/,
    paths:
      '<path d="M8 3 H12 M8.7 3 V8 L5 14.5 a2 2 0 0 0 1.8 2.8 H13.2 a2 2 0 0 0 1.8 -2.8 L11.3 8 V3"/>' +
      '<path d="M7 12.5 H13"/>',
  },
  // patch / fix → stitched plate
  {
    match: /patch|stitch|fix|repair|hotfix|mend/,
    paths:
      '<rect x="3.5" y="5" width="13" height="10" rx="2"/>' +
      '<path d="M10 5 V15 M7.5 8 H12.5 M7.5 12 H12.5"/>',
  },
  // rollback / revert → counter-clockwise arrow
  {
    match: /rollback|revert|undo|restore|back[- ]?out/,
    paths: '<path d="M5 6.5 a6 6 0 1 1 -1 6.5 M5 6.5 L4.5 2.8 M5 6.5 L8.6 5.6"/>',
  },
  // expand / contract / migration steps → twin arrows
  {
    match: /expand|contract|migrat|dual[- ]?write|phase/,
    paths: '<path d="M3 7 H12 M9 4 L12.5 7 L9 10 M17 13 H8 M11 10 L7.5 13 L11 16"/>',
  },
  // bisect / split → split diamond
  {
    match: /bisect|split|half|divide/,
    paths: '<path d="M10 3 L17 10 L10 17 L3 10 Z M10 3 V17"/>',
  },
  // rewrite / drafting → quill
  {
    match: /rewrite|draft|edit|author|rephrase|document/,
    paths: '<path d="M4 16 L13.5 6.5 a2.1 2.1 0 0 1 3 3 L7 19 H4 Z M12 8 L15 11"/>',
  },
  // caching / memoization → coin in slot
  {
    match: /cache|memo|store|persist/,
    paths: '<circle cx="10" cy="8" r="4.5"/><circle cx="10" cy="8" r="1.5"/><path d="M4 15.5 H16"/>',
  },
  // investigation / inspection → magnifier
  {
    match: /inspect|investigat|inquir|examine|review|audit/,
    paths: '<circle cx="8.6" cy="8.6" r="5"/><path d="M12.4 12.4 L17 17"/>',
  },
  // escalation / asking upward → signal mast
  {
    match: /escalat|ask|owner|human|defer|consult/,
    paths:
      '<path d="M10 17 V8"/><circle cx="10" cy="5.5" r="2"/>' +
      '<path d="M5.8 9.8 a6 6 0 0 1 0 -8.6 M14.2 1.2 a6 6 0 0 1 0 8.6"/>',
  },
  // shipping / deployment → vessel
  {
    match: /ship|deploy|release|launch|publish/,
    paths: '<path d="M3.5 12 H16.5 L14.5 16 H5.5 Z M10 12 V4 M10 4 L14.5 8.5 H10"/>',
  },
];

/**
 * Hash-fallback glyphs: abstract engravings. The per-option maker's mark
 * (hash-positioned rivet) keeps even same-family fallbacks distinct.
 */
const FALLBACK_PATHS: readonly string[] = [
  '<circle cx="10" cy="10" r="6.5"/><path d="M10 3.5 V10 L14 13"/>',
  '<rect x="4" y="4" width="12" height="12" rx="2.5"/><circle cx="10" cy="10" r="2.6"/>',
  '<path d="M10 3 L17 10 L10 17 L3 10 Z"/><circle cx="10" cy="10" r="1.6"/>',
  '<path d="M4 14 Q7 5 10 10 Q13 15 16 6"/><circle cx="4" cy="14" r="1.2"/><circle cx="16" cy="6" r="1.2"/>',
  '<circle cx="6.5" cy="10" r="3.4"/><circle cx="13.5" cy="10" r="3.4"/>',
  '<path d="M5 16 V8 M10 16 V4 M15 16 V11"/>',
];

const cache = new Map<string, IconSpec>();

/**
 * Generate the engraved-brass glyph for an inquiry option (SPEC-V3 §V3-5).
 * Deterministic: same `{id, caption, tone}` ⇒ byte-identical SVG.
 */
export function generateOptionIcon(option: InquiryOptionLike): IconSpec {
  const key = `${option.id}|${option.caption}|${option.tone ?? 'normal'}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const stroke = option.tone === 'danger' ? GLYPH_DANGER : GLYPH_STROKE;
  const text = `${option.id} ${option.caption}`.toLowerCase();
  const semantic = SEMANTIC_PATHS.find((entry) => entry.match.test(text));

  let paths: string;
  if (semantic !== undefined) {
    paths = semantic.paths;
  } else {
    const h = hashString(`opt:${option.id}`);
    const base = FALLBACK_PATHS[h % FALLBACK_PATHS.length] ?? FALLBACK_PATHS[0]!;
    // Maker's mark: a hash-positioned rivet keeps fallback glyphs distinct
    // across option ids sharing the same abstract engraving.
    const mx = (3 + ((h >>> 4) % 15)).toFixed(0);
    const my = (16 + ((h >>> 8) % 3)).toFixed(0);
    paths = `${base}<circle cx="${mx}" cy="${my}" r="0.7"/>`;
  }
  const spec = glyph(paths, stroke);
  cache.set(key, spec);
  return spec;
}
