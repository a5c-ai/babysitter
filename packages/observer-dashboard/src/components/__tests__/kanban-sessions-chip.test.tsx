/**
 * FROZEN acceptance tests — SESSIONS-CHIP-SPEC (frozen 2026-07-09), board
 * partition + the muted "⚡ N sessions" chip (AC1..AC7). Authored BEFORE the
 * implementation exists: the board does not yet hide idle sessions, render the
 * chip, or relabel "Bare Run" → "Idle session", so every test here FAILS today
 * (red step). Do NOT weaken these assertions — implement the feature instead.
 *
 * The polling hook is mocked (as in kanban-board.test.tsx) so the component is
 * driven with static data. Idle-session partition math itself is covered by
 * run-classification.test.ts; this file covers the board's VISIBLE behavior.
 *
 * Frozen DOM contract (testids/attributes the implementation MUST render):
 *   - [data-testid="kanban-sessions-chip"]     the single muted chip; text "⚡ N sessions"
 *   - chip carries data-tone="muted" (AC3: secondary, never an alert/attention tone)
 *   - [data-testid="kanban-sessions-toggle"]   the reveal toggle (button, aria-pressed)
 *   - revealed idle-session runs render as [data-testid="kanban-card"][data-run-id]
 *     and display the relabeled "Idle session" (AC6), never "Bare Run".
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { createMockRun, resetIdCounter } from "@/test/fixtures";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import type { LightRun, RunsListResponse } from "@/lib/services/run-query-service";

const mockUseSmartPolling = vi.fn();
vi.mock("@/hooks/use-smart-polling", () => ({
  useSmartPolling: (...args: unknown[]) => mockUseSmartPolling(...args),
}));

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

function lightRun(overrides: Partial<LightRun> = {}): LightRun {
  const run = createMockRun();
  return { ...run, events: [], totalEvents: 5, ...overrides } as LightRun;
}

/** A bare-run/0-task idle session (SESSIONS-CHIP-SPEC AC1). driver:"live" so
 *  that WITHOUT the feature it would flood the Working column (§1). */
function idleSession(runId: string, overrides: Partial<LightRun> = {}): LightRun {
  return lightRun({
    runId,
    processId: "bare-run",
    status: "waiting",
    driver: "live",
    isStale: false,
    tasks: [],
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    pendingBreakpoints: 0,
    ...overrides,
  });
}

function setupPolling(data: RunsListResponse | null) {
  mockUseSmartPolling.mockReturnValue({ data, loading: false, error: null, refresh: vi.fn() });
}

const chip = () => screen.getByTestId("kanban-sessions-chip");
const toggle = () => screen.getByTestId("kanban-sessions-toggle");
const cardFor = (runId: string) =>
  document.querySelector(`[data-testid="kanban-card"][data-run-id="${runId}"]`);

describe("KanbanBoard — idle-session chip (SESSIONS-CHIP-SPEC AC2/AC3)", () => {
  const IDLE_IDS = [
    "01KSESSIDLE00000000000001",
    "01KSESSIDLE00000000000002",
    "01KSESSIDLE00000000000003",
  ];
  const WORKING_ID = "01KSESSWORKING0000000001";
  const NEEDSYOU_ID = "01KSESSNEEDSYOU000000001";

  function board() {
    setupPolling({
      runs: [
        lightRun({ runId: NEEDSYOU_ID, status: "waiting", pendingBreakpoints: 1, totalTasks: 3 }),
        lightRun({ runId: WORKING_ID, status: "waiting", driver: "live", pendingBreakpoints: 0, totalTasks: 4 }),
        ...IDLE_IDS.map((id) => idleSession(id)),
      ],
      totalCount: 5,
    });
    render(<KanbanBoard />);
  }

  it("AC2: idle sessions do NOT appear in ANY board column by default (out of Working in particular)", () => {
    board();
    for (const id of IDLE_IDS) {
      expect(cardFor(id), `idle session ${id} must be hidden by default`).toBeNull();
    }
    // The real in-progress run and the needs-you run are unaffected.
    expect(cardFor(WORKING_ID)).not.toBeNull();
    expect(cardFor(NEEDSYOU_ID)).not.toBeNull();
  });

  it("AC5: the Working column count drops by exactly the idle count (1 real, not 4)", () => {
    board();
    // Corrected to the disjoint §15.4 rule per owner decision 2026-07-09: the
    // Working header equals its DISJOINT rendered-card count (waiting-lane cards
    // only). The dead needs-you run belongs to Needs-you (needsYou precedence),
    // NOT Working — it must not also count here. Pre-feature the waiting lane
    // held the live working run + 3 idle sessions (4); collapsing the idle
    // sessions drops it by exactly the idle count (3) → 1.
    expect(screen.getByTestId("kanban-column-count-waiting")).toHaveTextContent("1");
    expect(screen.getByTestId("kanban-column-count-needsyou")).toHaveTextContent("1");
  });

  it("AC3: exactly ONE muted chip renders the exact idle-session count as '⚡ N sessions'", () => {
    board();
    // Exactly one chip (not per-column, not per-run).
    expect(screen.getAllByTestId("kanban-sessions-chip")).toHaveLength(1);
    expect(chip()).toHaveTextContent("⚡ 3 sessions");
    // Muted/secondary: carries the muted tone and is NOT styled as an alert.
    expect(chip()).toHaveAttribute("data-tone", "muted");
    expect(chip()).not.toHaveAttribute("role", "alert");
    expect(chip()).not.toHaveAttribute("aria-live", "assertive");
  });

  it("AC3 (public-generic): the chip reads sensibly at small N and large N with no hardcoded scale", () => {
    // Stranger — N=3.
    board();
    expect(chip()).toHaveTextContent("⚡ 3 sessions");

    // Owner — N=194 (hidden by default, so cheap). Same chip, no scale assumption.
    resetIdCounter();
    setupPolling({
      runs: Array.from({ length: 194 }, (_, i) =>
        idleSession(`01KSESSBIG${String(i).padStart(14, "0")}`)
      ),
      totalCount: 194,
    });
    render(<KanbanBoard />);
    expect(screen.getAllByTestId("kanban-sessions-chip").pop()).toHaveTextContent(
      "⚡ 194 sessions"
    );
  });
});

describe("KanbanBoard — idle-session reveal toggle + relabel (SESSIONS-CHIP-SPEC AC4/AC6)", () => {
  const IDLE_IDS = ["01KSESSREV0000000000000A", "01KSESSREV0000000000000B"];

  function board() {
    setupPolling({
      runs: [
        lightRun({ runId: "01KSESSREVWORKING0000001", status: "waiting", driver: "live", totalTasks: 4 }),
        ...IDLE_IDS.map((id) => idleSession(id)),
      ],
      totalCount: 3,
    });
    render(<KanbanBoard />);
  }

  it("AC4: the chip toggle REVEALS the idle-session runs and HIDES them again", () => {
    board();

    // Hidden by default (AC2).
    for (const id of IDLE_IDS) expect(cardFor(id)).toBeNull();
    expect(toggle()).toHaveAttribute("aria-pressed", "false");

    // Reveal.
    fireEvent.click(toggle());
    for (const id of IDLE_IDS) expect(cardFor(id), `${id} revealed`).not.toBeNull();
    expect(toggle()).toHaveAttribute("aria-pressed", "true");

    // Hide again.
    fireEvent.click(toggle());
    for (const id of IDLE_IDS) expect(cardFor(id), `${id} re-hidden`).toBeNull();
    expect(toggle()).toHaveAttribute("aria-pressed", "false");
  });

  it("AC6: a revealed idle-session run shows the 'Idle session' label, never 'Bare Run'", () => {
    board();
    fireEvent.click(toggle());
    expect(screen.getAllByText("Idle session").length).toBeGreaterThan(0);
    expect(screen.queryByText("Bare Run")).toBeNull();
  });
});
