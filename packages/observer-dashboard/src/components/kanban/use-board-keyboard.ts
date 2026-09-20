"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { BoardGroupKey } from "@/components/kanban/column-model";

/**
 * Roving tabindex across board cards — SPEC-vibekanban §8 / AC-24.
 *
 * Modeled on the existing use-keyboard.ts hook (ref-backed handler state, no
 * re-subscription churn). Exactly ONE card is the tab stop (tabIndex=0); every
 * other card is tabIndex=-1 so a single Tab enters and leaves the board:
 *   - ArrowUp/ArrowDown  move within the column (clamped at the edges)
 *   - ArrowLeft/ArrowRight jump to the same index in the adjacent column
 *     (index clamped to the target column's length; empty columns are skipped
 *     — focus always lands on a real card)
 *   - Home/End           first/last card in the column
 *   - Enter/Space        open the focused card's run page (read-only nav)
 *
 * Focus is preserved across SSE refetches by runId: if the focused run moved
 * columns the roving stop follows it (positions are recomputed from runId
 * every keystroke); if it disappeared, the stop falls back to the same
 * index in the remembered column (§8 "focus falls to the same index").
 *
 * Read-only (contract LAW): the only side effects are DOM focus moves and
 * router navigation to /runs/{runId} — never a state mutation.
 */

/** One visible board column and its card runIds, in rendered order.
 * Keys are the four DISPLAY columns (§13.2b — owner gate 2026-07-05 run
 * 01KWRR8XAHFCDEGCRBRFHFF44W); navigation is bucket-agnostic. */
export interface BoardColumnRuns {
  key: BoardGroupKey;
  runIds: string[];
}

/** A position on the board: visible-column index + card index within it. */
export interface BoardPosition {
  column: number;
  index: number;
}

const NAV_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
]);

/** Estimated card height for revealing virtualized targets (kanban-column). */
const ESTIMATED_CARD_HEIGHT = 110;

/** How many animation frames to retry focusing a virtualized card. */
const REVEAL_RETRY_FRAMES = 10;

/**
 * Pure move computation (unit-tested): given the visible columns and a current
 * position, return the next position for a navigation key, or null when the
 * move has nowhere to go (edge of the board / no non-empty adjacent column).
 */
export function moveBoardFocus(
  columns: BoardColumnRuns[],
  pos: BoardPosition,
  key: string
): BoardPosition | null {
  const col = columns[pos.column];
  if (!col || col.runIds.length === 0) return null;

  switch (key) {
    case "ArrowUp":
      return pos.index > 0 ? { column: pos.column, index: pos.index - 1 } : null;
    case "ArrowDown":
      return pos.index < col.runIds.length - 1
        ? { column: pos.column, index: pos.index + 1 }
        : null;
    case "Home":
      return pos.index !== 0 ? { column: pos.column, index: 0 } : null;
    case "End":
      return pos.index !== col.runIds.length - 1
        ? { column: pos.column, index: col.runIds.length - 1 }
        : null;
    case "ArrowLeft":
    case "ArrowRight": {
      // Adjacent column, same index (clamped). Empty columns are skipped so
      // focus always lands on a card.
      const step = key === "ArrowRight" ? 1 : -1;
      for (
        let c = pos.column + step;
        c >= 0 && c < columns.length;
        c += step
      ) {
        const target = columns[c];
        if (target.runIds.length > 0) {
          return { column: c, index: Math.min(pos.index, target.runIds.length - 1) };
        }
      }
      return null;
    }
    default:
      return null;
  }
}

/** Locate a runId on the board; null when it is not rendered in any column. */
function findPosition(
  columns: BoardColumnRuns[],
  runId: string
): BoardPosition | null {
  for (let c = 0; c < columns.length; c++) {
    const index = columns[c].runIds.indexOf(runId);
    if (index !== -1) return { column: c, index };
  }
  return null;
}

/** Focus the DOM node of a card by runId; false when it is not in the DOM. */
function focusCardElement(runId: string): boolean {
  const el = document.querySelector<HTMLElement>(
    `[data-testid="kanban-card"][data-run-id="${runId}"]`
  );
  if (!el) return false;
  el.focus();
  return true;
}

export interface UseBoardKeyboardResult {
  /** The single roving tab stop: only this card renders tabIndex=0. */
  tabStopRunId: string | null;
  /** Card onFocus: adopt the card the user focused (click / programmatic). */
  onCardFocus: (runId: string) => void;
  /** Card onKeyDown: roving-tabindex navigation + Enter/Space open. */
  onCardKeyDown: (event: React.KeyboardEvent<HTMLElement>, runId: string) => void;
}

export function useBoardKeyboard(
  columns: BoardColumnRuns[]
): UseBoardKeyboardResult {
  const router = useRouter();
  const [focusedRunId, setFocusedRunId] = useState<string | null>(null);

  // Ref-backed state (use-keyboard.ts pattern): handlers always see the
  // freshest columns without re-creating listeners every refetch.
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const lastPosRef = useRef<BoardPosition | null>(null);

  /**
   * Move DOM focus to a card, revealing it first when virtualization has it
   * out of the DOM: scroll the column container near the target index and
   * retry across a few frames while the virtualizer renders it.
   */
  const revealAndFocus = useCallback(
    (columnKey: BoardGroupKey, index: number, runId: string) => {
      const attempt = (framesLeft: number) => {
        if (focusCardElement(runId) || framesLeft <= 0) return;
        const container = document.querySelector<HTMLElement>(
          `[data-testid="kanban-column-cards-${columnKey}"]`
        );
        if (container) container.scrollTop = index * ESTIMATED_CARD_HEIGHT;
        requestAnimationFrame(() => attempt(framesLeft - 1));
      };
      attempt(REVEAL_RETRY_FRAMES);
    },
    []
  );

  // §8 focus-follows-run across refetches: recompute the focused position on
  // every columns change. Present => remember the (possibly new) position; the
  // roving stop follows the runId. Gone => fall back to the same index in the
  // remembered column and move DOM focus only if it was on the board.
  useEffect(() => {
    if (!focusedRunId) return;
    const pos = findPosition(columns, focusedRunId);
    if (pos) {
      lastPosRef.current = pos;
      return;
    }
    const last = lastPosRef.current;
    let fallback: BoardPosition | null = null;
    if (last) {
      // Clamp the remembered position into the current board shape,
      // preferring the same column, else the nearest non-empty one.
      const order = [last.column, ...columns.map((_, i) => i)];
      for (const c of order) {
        const col = columns[c];
        if (col && col.runIds.length > 0) {
          fallback = { column: c, index: Math.min(last.index, col.runIds.length - 1) };
          break;
        }
      }
    }
    if (!fallback) {
      setFocusedRunId(null);
      return;
    }
    const nextRunId = columns[fallback.column].runIds[fallback.index];
    lastPosRef.current = fallback;
    setFocusedRunId(nextRunId);
    const active = document.activeElement;
    if (active && active.closest('[data-testid="kanban-board"]')) {
      revealAndFocus(columns[fallback.column].key, fallback.index, nextRunId);
    }
  }, [columns, focusedRunId, revealAndFocus]);

  const onCardFocus = useCallback((runId: string) => {
    setFocusedRunId(runId);
    const pos = findPosition(columnsRef.current, runId);
    if (pos) lastPosRef.current = pos;
  }, []);

  const onCardKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>, runId: string) => {
      // Only act on the card itself: keystrokes inside interactive children
      // (option buttons, the custom-answer textarea, copy buttons) must keep
      // their native behavior — same guard idea as use-keyboard.ts.
      if (event.target !== event.currentTarget) return;

      if (event.key === "Enter" || event.key === " ") {
        // Open the focused card's run page (§8) — read-only navigation.
        event.preventDefault();
        router.push(`/runs/${runId}`);
        return;
      }
      if (!NAV_KEYS.has(event.key)) return;

      const cols = columnsRef.current;
      const pos = findPosition(cols, runId);
      if (!pos) return;
      const next = moveBoardFocus(cols, pos, event.key);
      // Consume nav keys even at the edges so the page never scrolls under
      // the roving focus.
      event.preventDefault();
      if (!next) return;
      const nextRunId = cols[next.column].runIds[next.index];
      lastPosRef.current = next;
      setFocusedRunId(nextRunId);
      revealAndFocus(cols[next.column].key, next.index, nextRunId);
    },
    [router, revealAndFocus]
  );

  // The roving tab stop: the focused run when it is on the board, else the
  // first card of the first non-empty column.
  const tabStopRunId =
    (focusedRunId && findPosition(columns, focusedRunId) ? focusedRunId : null) ??
    columns.find((c) => c.runIds.length > 0)?.runIds[0] ??
    null;

  return { tabStopRunId, onCardFocus, onCardKeyDown };
}
