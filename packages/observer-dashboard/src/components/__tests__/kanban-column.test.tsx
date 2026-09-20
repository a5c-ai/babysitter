/**
 * Unit tests — KanbanColumn (SPEC-vibekanban §3.4 count honesty, §7 empty
 * placeholders, §8 list semantics; Wave 2).
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/test-utils";
import { createMockRun, resetIdCounter } from "@/test/fixtures";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import type { BoardRun } from "@/components/kanban/column-model";

// Mock next/link (the card renders a stretched overlay Link).
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

beforeEach(() => {
  resetIdCounter();
});

/** Build a BoardRun from the shared Run fixture (events stripped);
 *  overrides apply on top so BoardRun-only fields work. */
function boardRun(overrides: Partial<BoardRun> = {}): BoardRun {
  const run = createMockRun();
  return { ...run, events: [], totalEvents: 5, ...overrides } as BoardRun;
}

describe("KanbanColumn (SPEC-vibekanban Wave 2)", () => {
  it("renders the header count equal to the number of rendered cards (§3.4 count honesty)", () => {
    const runs = [
      boardRun({ runId: "01KCOLTESTRUNAAAAAAAAAA1", status: "waiting" }),
      boardRun({ runId: "01KCOLTESTRUNAAAAAAAAAA2", status: "waiting" }),
    ];
    render(<KanbanColumn columnKey="waiting" runs={runs} />);

    expect(screen.getByTestId("kanban-column-count-waiting")).toHaveTextContent("2");
    expect(screen.getAllByTestId("kanban-card")).toHaveLength(2);
  });

  it("exposes list semantics with an accessible column name (§8)", () => {
    render(
      <KanbanColumn
        columnKey="waiting"
        runs={[boardRun({ runId: "01KCOLTESTRUNAAAAAAAAAA3", status: "waiting" })]}
      />
    );
    // Design-QA (nit): singular count reads "1 run", never "1 runs".
    expect(screen.getByRole("list", { name: "Working, 1 run" })).toBeInTheDocument();
  });

  it("pluralizes the accessible column name for multiple runs (§8)", () => {
    render(
      <KanbanColumn
        columnKey="waiting"
        runs={[
          boardRun({ runId: "01KCOLTESTRUNAAAAAAAAAA8", status: "waiting" }),
          boardRun({ runId: "01KCOLTESTRUNAAAAAAAAAA9", status: "waiting" }),
        ]}
      />
    );
    expect(screen.getByRole("list", { name: "Working, 2 runs" })).toBeInTheDocument();
  });

  it("shows the quiet §7 placeholder for an empty always-visible column", () => {
    render(<KanbanColumn columnKey="needsyou" runs={[]} />);
    // owner 2026-07-08: de-AI copy (no em-dashes) + answer-flow clarity
    expect(screen.getByText("Nothing needs you. All clear.")).toBeInTheDocument();
    expect(screen.getByTestId("kanban-column-count-needsyou")).toHaveTextContent("0");
    expect(screen.queryAllByTestId("kanban-card")).toHaveLength(0);
  });

  // Amended per owner gate 2026-07-05 run 01KWRR8XAHFCDEGCRBRFHFF44W: the
  // count-honesty tooltip now lives on the Stalled host column (AC-10 text).
  it("surfaces the count-honesty tooltip on the header (§3.4 — no silent mismatch)", () => {
    render(
      <KanbanColumn
        columnKey="stalled"
        runs={[boardRun({ runId: "01KCOLTESTRUNAAAAAAAAAA4", status: "waiting", driver: "none" })]}
        countTooltip="+2 more stalled runs are shown under Needs you"
      />
    );
    const header = screen.getByTitle("+2 more stalled runs are shown under Needs you");
    expect(header).toBeInTheDocument();
  });

  // UX-R2 §13.5/AC-49: the absorbed-count disclosure is programmatically
  // associated with the column header — never hover-title-only.
  it("AC-49: aria-describedby links the header label to the absorbed-count disclosure text", () => {
    render(
      <KanbanColumn
        columnKey="waiting"
        runs={[boardRun({ runId: "01KCOLTESTRUNAAAAAAAAAA5", status: "waiting" })]}
        countTooltip="+1 more working run is shown under Needs you"
      />
    );

    const label = screen.getByTestId("kanban-column-label-waiting");
    expect(label).toHaveAttribute("aria-describedby", "kanban-absorbed-waiting");
    // The header's accessible description carries the tooltip text.
    expect(label).toHaveAccessibleDescription(
      "+1 more working run is shown under Needs you"
    );
    expect(screen.getByTestId("kanban-absorbed-waiting")).toHaveTextContent(
      "+1 more working run is shown under Needs you"
    );
  });

  it("AC-49 (complement): no dangling aria-describedby when there is nothing to disclose", () => {
    render(
      <KanbanColumn
        columnKey="waiting"
        runs={[boardRun({ runId: "01KCOLTESTRUNAAAAAAAAAA6", status: "waiting" })]}
      />
    );
    expect(screen.getByTestId("kanban-column-label-waiting")).not.toHaveAttribute(
      "aria-describedby"
    );
    expect(
      screen.queryByTestId("kanban-absorbed-waiting")
    ).not.toBeInTheDocument();
  });
});
