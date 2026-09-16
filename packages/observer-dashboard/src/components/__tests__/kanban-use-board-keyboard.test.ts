/**
 * Unit tests — moveBoardFocus (SPEC-vibekanban §8 / AC-24, Wave 4).
 *
 * The pure move computation behind the roving tabindex hook
 * (use-board-keyboard.ts): ArrowUp/ArrowDown within a column (clamped),
 * ArrowLeft/ArrowRight to the same index in the adjacent column (index
 * clamped, empty columns skipped), Home/End to the column edges. The DOM
 * wiring (focus moves, Enter navigation) is covered by the board component
 * test and e2e AC-24.
 */

import { describe, it, expect } from "vitest";
import {
  moveBoardFocus,
  type BoardColumnRuns,
} from "@/components/kanban/use-board-keyboard";

// Column keys amended per owner gate 2026-07-05 run 01KWRR8XAHFCDEGCRBRFHFF44W:
// 4-column taxonomy (needsyou | waiting | stalled | done).
/** Shorthand: a visible column with n synthetic runIds. */
function col(key: BoardColumnRuns["key"], ids: string[]): BoardColumnRuns {
  return { key, runIds: ids };
}

const columns: BoardColumnRuns[] = [
  col("needsyou", ["bp-1", "bp-2", "bp-3"]),
  col("stalled", ["orph-1", "orph-2"]),
  col("waiting", ["work-1"]),
  col("done", ["done-1", "done-2", "done-3", "done-4"]),
];

describe("moveBoardFocus (SPEC-vibekanban §8)", () => {
  it("ArrowDown moves to the next card in the same column and clamps at the bottom", () => {
    expect(moveBoardFocus(columns, { column: 0, index: 0 }, "ArrowDown")).toEqual({
      column: 0,
      index: 1,
    });
    // Bottom edge: no move.
    expect(moveBoardFocus(columns, { column: 0, index: 2 }, "ArrowDown")).toBeNull();
  });

  it("ArrowUp moves to the previous card and clamps at the top", () => {
    expect(moveBoardFocus(columns, { column: 0, index: 2 }, "ArrowUp")).toEqual({
      column: 0,
      index: 1,
    });
    expect(moveBoardFocus(columns, { column: 0, index: 0 }, "ArrowUp")).toBeNull();
  });

  it("ArrowRight jumps to the same index in the adjacent column", () => {
    expect(moveBoardFocus(columns, { column: 0, index: 1 }, "ArrowRight")).toEqual({
      column: 1,
      index: 1,
    });
  });

  it("ArrowRight clamps the index to the target column's length", () => {
    // needsyou index 2 -> stalled has only 2 cards -> lands on index 1.
    expect(moveBoardFocus(columns, { column: 0, index: 2 }, "ArrowRight")).toEqual({
      column: 1,
      index: 1,
    });
  });

  it("ArrowLeft mirrors ArrowRight and clamps at the board edge", () => {
    expect(moveBoardFocus(columns, { column: 1, index: 1 }, "ArrowLeft")).toEqual({
      column: 0,
      index: 1,
    });
    expect(moveBoardFocus(columns, { column: 0, index: 0 }, "ArrowLeft")).toBeNull();
    expect(moveBoardFocus(columns, { column: 3, index: 0 }, "ArrowRight")).toBeNull();
  });

  it("ArrowRight/ArrowLeft skip EMPTY columns so focus always lands on a card", () => {
    const withEmpty: BoardColumnRuns[] = [
      col("needsyou", ["bp-1", "bp-2"]),
      col("stalled", []),
      col("done", ["done-1"]),
    ];
    expect(moveBoardFocus(withEmpty, { column: 0, index: 1 }, "ArrowRight")).toEqual({
      column: 2,
      index: 0,
    });
    expect(moveBoardFocus(withEmpty, { column: 2, index: 0 }, "ArrowLeft")).toEqual({
      column: 0,
      index: 0,
    });
  });

  it("Home/End move to the first/last card of the column (no-op when already there)", () => {
    expect(moveBoardFocus(columns, { column: 3, index: 2 }, "Home")).toEqual({
      column: 3,
      index: 0,
    });
    expect(moveBoardFocus(columns, { column: 3, index: 1 }, "End")).toEqual({
      column: 3,
      index: 3,
    });
    expect(moveBoardFocus(columns, { column: 3, index: 0 }, "Home")).toBeNull();
    expect(moveBoardFocus(columns, { column: 3, index: 3 }, "End")).toBeNull();
  });

  it("returns null for non-navigation keys and out-of-board positions", () => {
    expect(moveBoardFocus(columns, { column: 0, index: 0 }, "a")).toBeNull();
    expect(moveBoardFocus(columns, { column: 9, index: 0 }, "ArrowDown")).toBeNull();
    expect(moveBoardFocus([], { column: 0, index: 0 }, "ArrowDown")).toBeNull();
  });
});
