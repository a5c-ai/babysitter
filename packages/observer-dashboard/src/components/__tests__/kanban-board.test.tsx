/**
 * Unit tests — KanbanBoard (SPEC-vibekanban §4 data flow, §3.2 auto-hide,
 * §7 loading/error/empty states; Wave 2).
 *
 * The polling hook is mocked (as in run-list.test.tsx) so the component is
 * driven with static data; partition behavior itself is covered by
 * kanban-column-model.test.ts.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@/test/test-utils";
import { createMockRun, resetIdCounter } from "@/test/fixtures";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import type { LightRun, RunsListResponse } from "@/lib/services/run-query-service";

// Mock the polling hook so we can drive the component with static data.
const mockUseSmartPolling = vi.fn();
vi.mock("@/hooks/use-smart-polling", () => ({
  useSmartPolling: (...args: unknown[]) => mockUseSmartPolling(...args),
}));

// Mock next/link
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

beforeEach(() => {
  resetIdCounter();
  vi.clearAllMocks();
});

/** Build a LightRun from the shared Run fixture (events stripped);
 *  overrides apply on top so LightRun-only fields (pendingBreakpoints) work. */
function lightRun(overrides: Partial<LightRun> = {}): LightRun {
  const run = createMockRun();
  return { ...run, events: [], totalEvents: 5, ...overrides } as LightRun;
}

function setupPolling(
  data: RunsListResponse | null,
  { loading = false, error = null }: { loading?: boolean; error?: string | null } = {}
) {
  mockUseSmartPolling.mockReturnValue({ data, loading, error, refresh: vi.fn() });
}

describe("KanbanBoard (SPEC-vibekanban Wave 2)", () => {
  it("fetches ONE all-runs query (§4: status='', sort=status, limit=500, offset=0)", () => {
    setupPolling({ runs: [], totalCount: 0 });
    render(<KanbanBoard />);
    expect(mockUseSmartPolling).toHaveBeenCalledTimes(1);
    expect(mockUseSmartPolling.mock.calls[0][0]).toBe(
      "/api/runs?status=&sort=status&limit=500&offset=0&search="
    );
  });

  it("renders per-column loading skeletons with aria-busy, never the board testid (§7)", () => {
    setupPolling(null, { loading: true });
    render(<KanbanBoard />);
    expect(screen.getByTestId("kanban-board-loading")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading runs")).toBeInTheDocument();
    expect(screen.queryByTestId("kanban-board")).not.toBeInTheDocument();
  });

  it("renders the run-list-error treatment full-width on error, board hidden (§7)", () => {
    setupPolling(null, { error: "boom" });
    render(<KanbanBoard />);
    expect(screen.getByTestId("kanban-board-error")).toHaveTextContent("Failed to load runs: boom");
    expect(screen.queryByTestId("kanban-board")).not.toBeInTheDocument();
  });

  it("renders the shared EmptyState full-width for an empty board (§7)", () => {
    setupPolling({ runs: [], totalCount: 0 });
    render(<KanbanBoard />);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("No runs found")).toBeInTheDocument();
    expect(screen.queryByTestId("kanban-board")).not.toBeInTheDocument();
  });

  // Amended per owner gate 2026-07-05 run 01KWRR8XAHFCDEGCRBRFHFF44W:
  // 4-column taxonomy + color map (§13.2b) — Stalled (orphaned+stale hosts)
  // auto-hides when empty; Needs you / Working / Done are always visible.
  it("auto-hides the Stalled column when empty and keeps the three always-visible columns (§13.2b)", () => {
    setupPolling({
      runs: [lightRun({ runId: "01KBOARDTESTWORKING00001", status: "waiting", driver: "live" })],
      totalCount: 1,
    });
    render(<KanbanBoard />);

    expect(screen.getByTestId("kanban-board")).toBeInTheDocument();
    expect(screen.getByTestId("kanban-column-needsyou")).toBeInTheDocument();
    expect(screen.getByTestId("kanban-column-waiting")).toBeInTheDocument();
    expect(screen.getByTestId("kanban-column-done")).toBeInTheDocument();
    expect(screen.queryByTestId("kanban-column-stalled")).not.toBeInTheDocument();
  });

  // Amended per owner gate 2026-07-05 run 01KWRR8XAHFCDEGCRBRFHFF44W: the six
  // buckets render grouped under four display columns in §13.2b order.
  it("renders all four columns in §13.2b order when every bucket is populated", () => {
    setupPolling({
      runs: [
        lightRun({ runId: "01KBOARDTESTNEEDSYOU0001", status: "waiting", pendingBreakpoints: 1 }),
        lightRun({ runId: "01KBOARDTESTORPHANED0002", status: "waiting", driver: "none", pendingBreakpoints: 0 }),
        lightRun({ runId: "01KBOARDTESTWORKING00003", status: "waiting", driver: "live", pendingBreakpoints: 0 }),
        lightRun({ runId: "01KBOARDTESTSTALE0000004", status: "waiting", driver: "live", isStale: true, pendingBreakpoints: 0 }),
        lightRun({ runId: "01KBOARDTESTFAILED000005", status: "failed" }),
        lightRun({ runId: "01KBOARDTESTDONE00000006", status: "completed" }),
      ],
      totalCount: 6,
    });
    const { container } = render(<KanbanBoard />);

    const columns = Array.from(
      container.querySelectorAll('[data-testid^="kanban-column-"]')
    )
      .map((el) => el.getAttribute("data-testid"))
      .filter(
        (id) =>
          id !== null &&
          !id.startsWith("kanban-column-count-") &&
          !id.startsWith("kanban-column-cards-") &&
          !id.startsWith("kanban-column-info-") &&
          !id.startsWith("kanban-column-label-") &&
          !id.startsWith("kanban-column-tail-")
      );
    expect(columns).toEqual([
      "kanban-column-needsyou",
      "kanban-column-waiting",
      "kanban-column-stalled",
      "kanban-column-done",
    ]);
  });

  it("surfaces hidden-project needs-you AND live runs (model A §15.1, owner gate 2026-07-06b), collapses the rest", () => {
    // SUPERSEDES the wave-1 §6.3 "hidden excluded from all columns except
    // Needs-you" assertion: under hidden model A, hidden LIVE runs surface into
    // Working (AC-75) alongside the always-surfaced needs-you approvals, each
    // flagged with the EyeOff marker; only orphaned/stale/done stay collapsed.
    setupPolling({
      runs: [
        lightRun({
          runId: "01KBOARDTESTHIDDENBP0007",
          status: "waiting",
          pendingBreakpoints: 1,
          projectName: "hidden-project",
        }),
        lightRun({
          runId: "01KBOARDTESTHIDDENWK0008",
          status: "waiting",
          driver: "live",
          pendingBreakpoints: 0,
          projectName: "hidden-project",
        }),
        // A hidden STALE run stays collapsed (not a surfaced column).
        lightRun({
          runId: "01KBOARDTESTHIDDENST0009",
          status: "waiting",
          driver: "none",
          isStale: true,
          pendingBreakpoints: 0,
          projectName: "hidden-project",
        }),
      ],
      totalCount: 3,
    });
    render(<KanbanBoard hiddenProjects={new Set(["hidden-project"])} />);

    // Needs-you approval surfaced (1); live run surfaced into Working (1).
    expect(screen.getByTestId("kanban-column-count-needsyou")).toHaveTextContent("1");
    expect(screen.getByTestId("kanban-column-count-waiting")).toHaveTextContent("1");
    // The stale hidden run is collapsed → Stalled column auto-hides (0).
    expect(screen.queryByTestId("kanban-column-stalled")).not.toBeInTheDocument();
    // Both surfaced cards carry the hidden-project EyeOff marker (sr-only text).
    const surfaced = screen.getAllByText("project hidden from grid");
    expect(surfaced.length).toBe(2);
  });

  it("§15.1 (AC-84/86): a future-wake scheduled run renders in its OWN Scheduled column, calm, not Working/Stalled", () => {
    const wakeFuture = new Date(Date.now() + 6 * 3_600_000).toISOString();
    setupPolling({
      runs: [
        lightRun({
          runId: "01KSCHEDFUTURE00000000001",
          status: "waiting",
          driver: "scheduled",
          sleepWakeAt: wakeFuture,
          pendingBreakpoints: 0,
        }),
      ],
      totalCount: 1,
    });
    render(<KanbanBoard />);

    // Its own column, count 1; Working + Stalled auto-hide (empty).
    expect(screen.getByTestId("kanban-column-count-scheduled")).toHaveTextContent("1");
    expect(screen.queryByTestId("kanban-column-stalled")).not.toBeInTheDocument();
    expect(screen.getByTestId("kanban-column-count-waiting")).toHaveTextContent("0");
    // Calm "next run" affordance (not overdue/resume).
    expect(screen.getByTestId("kanban-scheduled-badge")).toHaveTextContent(/next run/i);
    expect(screen.getByTestId("kanban-scheduled-badge")).not.toHaveAttribute(
      "data-scheduled-overdue"
    );
  });

  it("§15.1 (AC-85/88): an overdue scheduled run renders the amber wake-overdue state with a copyable INERT run:iterate", () => {
    const wakePast = new Date(Date.now() - 17 * 3_600_000).toISOString();
    setupPolling({
      runs: [
        lightRun({
          runId: "01KSCHEDOVERDUE0000000001",
          status: "waiting",
          driver: "scheduled",
          sleepWakeAt: wakePast,
          pendingBreakpoints: 0,
        }),
      ],
      totalCount: 1,
    });
    render(<KanbanBoard />);

    const badge = screen.getByTestId("kanban-scheduled-badge");
    expect(badge).toHaveAttribute("data-scheduled-overdue", "true");
    expect(badge).toHaveTextContent(/wake overdue/i);
    // The copyable resume command is present as inert selectable text (AC-88).
    expect(screen.getByTestId("kanban-bp-run-iterate-text")).toHaveTextContent(
      "babysitter run:iterate 01KSCHEDOVERDUE0000000001"
    );
  });
});

// ---------------------------------------------------------------------------
// Wave 4 — keyboard, live region, fetch-window (SPEC §7, §8)
// ---------------------------------------------------------------------------

describe("KanbanBoard (SPEC-vibekanban Wave 4 — a11y & polish)", () => {
  it("renders ONE polite live region at board level and never an assertive one (§8)", () => {
    setupPolling({
      runs: [lightRun({ runId: "01KBOARDTESTWORKING00001", status: "waiting", driver: "live" })],
      totalCount: 1,
    });
    const { container } = render(<KanbanBoard />);

    const region = screen.getByTestId("kanban-live-region");
    expect(region).toHaveAttribute("aria-live", "polite");
    // The breakpoint banner owns the assertive alarm — the board adds none.
    expect(container.querySelector('[aria-live="assertive"]')).toBeNull();
    // Baseline render announces nothing (only COUNT CHANGES are announced,
    // debounced ≥5s — SSE chatter never floods AT).
    expect(region).toHaveTextContent("");
  });

  it("shows the fetch-window notice and per-column 'View all in list' tails when totalCount exceeds the 500 window (§7)", () => {
    setupPolling({
      runs: [
        lightRun({ runId: "01KBOARDTESTWORKING00001", status: "waiting", driver: "live" }),
        lightRun({ runId: "01KBOARDTESTDONE00000002", status: "completed" }),
      ],
      totalCount: 501,
    });
    const onViewAllInList = vi.fn();
    render(<KanbanBoard onViewAllInList={onViewAllInList} />);

    expect(screen.getByTestId("kanban-fetch-window-notice")).toHaveTextContent(
      // owner 2026-07-08: de-AI copy (no em-dashes) + answer-flow clarity
      "Showing the 500 most relevant runs. Open List view for everything"
    );
    // Every rendered column gets the tail (the truncated window may be hiding
    // runs from any of them). Column key amended per owner gate 2026-07-05 run
    // 01KWRR8XAHFCDEGCRBRFHFF44W: completed hosts under Done.
    const tail = screen.getByTestId("kanban-column-tail-done");
    expect(tail).toHaveTextContent("View all in list");
    fireEvent.click(tail);
    expect(onViewAllInList).toHaveBeenCalledWith("done");
  });

  it("renders NO fetch-window notice or tails when every run fits the window (§7)", () => {
    setupPolling({
      runs: [lightRun({ runId: "01KBOARDTESTWORKING00001", status: "waiting", driver: "live" })],
      totalCount: 1,
    });
    render(<KanbanBoard onViewAllInList={vi.fn()} />);

    expect(screen.queryByTestId("kanban-fetch-window-notice")).not.toBeInTheDocument();
    expect(screen.queryByTestId("kanban-column-tail-waiting")).not.toBeInTheDocument();
  });

  it("roving tabindex: exactly one card is the tab stop; ArrowDown/ArrowRight move DOM focus (§8 / AC-24)", () => {
    const NOW = new Date("2026-07-04T10:00:00.000Z").toISOString();
    setupPolling({
      runs: [
        // Two needs-you cards + two orphaned cards (AC-24 shape). Identical
        // updatedAt => within-column order is the runId tiebreaker (§3.3).
        lightRun({ runId: "01KBOARDKBDBPA0000000001", status: "waiting", pendingBreakpoints: 1, updatedAt: NOW }),
        lightRun({ runId: "01KBOARDKBDBPB0000000002", status: "waiting", pendingBreakpoints: 1, updatedAt: NOW }),
        lightRun({ runId: "01KBOARDKBDORPHA00000003", status: "waiting", driver: "orphaned", pendingBreakpoints: 0, updatedAt: NOW }),
        lightRun({ runId: "01KBOARDKBDORPHB00000004", status: "waiting", driver: "orphaned", pendingBreakpoints: 0, updatedAt: NOW }),
      ],
      totalCount: 4,
    });
    const { container } = render(<KanbanBoard />);

    const cards = Array.from(
      container.querySelectorAll<HTMLElement>('[data-testid="kanban-card"]')
    );
    expect(cards).toHaveLength(4);
    // Exactly one roving tab stop (the first card of the first column).
    expect(cards.filter((el) => el.tabIndex === 0).map((el) => el.dataset.runId)).toEqual([
      "01KBOARDKBDBPA0000000001",
    ]);
    expect(cards.filter((el) => el.tabIndex === -1)).toHaveLength(3);

    const cardFor = (runId: string) =>
      container.querySelector<HTMLElement>(`[data-testid="kanban-card"][data-run-id="${runId}"]`)!;

    // Focus the first Needs-you card, then ArrowDown => next card in column.
    const first = cardFor("01KBOARDKBDBPA0000000001");
    act(() => first.focus());
    fireEvent.keyDown(first, { key: "ArrowDown" });
    expect(document.activeElement?.getAttribute("data-run-id")).toBe(
      "01KBOARDKBDBPB0000000002"
    );

    // ArrowRight => same index in the adjacent non-empty (Stalled) column —
    // host remap per owner gate 2026-07-05 run 01KWRR8XAHFCDEGCRBRFHFF44W.
    fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
    expect(document.activeElement?.getAttribute("data-run-id")).toBe(
      "01KBOARDKBDORPHB00000004"
    );

    // The roving tab stop followed the focus.
    expect(cardFor("01KBOARDKBDORPHB00000004").tabIndex).toBe(0);
    expect(cardFor("01KBOARDKBDBPA0000000001").tabIndex).toBe(-1);
  });
});
