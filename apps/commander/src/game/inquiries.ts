/**
 * Inquiry Dock presentation helpers (SPEC-V3 §V3-5): the dock shows the
 * NEWEST inquiries first, caps the visible stack at three bubbles and
 * summarizes the rest as "+N more". Pure — unit-tested apart from React.
 */

import type { SimInquiryView } from '../backend/mock/simulation';

/** Max inquiry bubbles visible in the dock at once (§V3-5). */
export const DOCK_VISIBLE_CAP = 3;

export interface DockView {
  /** Newest-first visible bubbles (≤ DOCK_VISIBLE_CAP). */
  visible: SimInquiryView[];
  /** Hidden-inquiry count for the "+N more" chip (0 = chip hidden). */
  overflow: number;
}

/** Derive the dock view from the store's inquiry list (oldest-first). */
export function dockView(inquiries: readonly SimInquiryView[], cap: number = DOCK_VISIBLE_CAP): DockView {
  const newestFirst = [...inquiries].reverse();
  return {
    visible: newestFirst.slice(0, cap),
    overflow: Math.max(0, newestFirst.length - cap),
  };
}
