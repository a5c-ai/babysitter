/**
 * FROZEN acceptance test — SPEC-vibekanban §10, AC-26 (card chip gating).
 *
 * Authored BEFORE any board implementation exists (pending-impl). Imports the
 * SPEC-declared component path `src/components/kanban/kanban-card` (SPEC §9).
 * Until Wave 2 lands that component, this file fails to load with a
 * module-resolution error — the expected frozen state. Do NOT weaken these
 * assertions; implement the component instead.
 *
 * Contract under test (SPEC §5, mirroring run-list.tsx chip gating):
 *   <KanbanCard run={lightRun} />
 *   - non-terminal runs render the LivenessChip (live wifi chip / orphaned
 *     triangle chip) with its sr-only expansions preserved;
 *   - terminal runs render the neutral StatusDot ("Run status: ..." sr-only).
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import type { Run } from "@/types";
import type { LightRun } from "@/lib/services/run-query-service";
// pending-impl: SPEC-declared component path — does not exist until Wave 2.
import { KanbanCard } from "@/components/kanban/kanban-card";

const RECENT_DATE = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

function makeLightRun(overrides: Partial<LightRun> = {}): LightRun {
  const base: Omit<Run, "events"> = {
    runId: "01KTESTKANBANCARD0000001",
    processId: "data-pipeline",
    status: "waiting",
    createdAt: RECENT_DATE,
    updatedAt: RECENT_DATE,
    tasks: [],
    totalTasks: 4,
    completedTasks: 2,
    failedTasks: 0,
    projectName: "my-project",
  };
  return {
    ...base,
    events: [] as never[],
    totalEvents: 5,
    ...overrides,
  } as LightRun;
}

// sr-only strings are the exact LivenessChip/StatusDot expansions from
// src/components/dashboard/run-list.tsx (a11y-status-chip-title-only).
// owner 2026-07-08: de-AI copy (no em-dashes) + answer-flow clarity
const LIVE_SR_TEXT = /in progress, recent activity means this run is actively being worked/i;
const ORPHANED_SR_TEXT = /no live orchestrator is attached/i;
const STATUS_DOT_SR_TEXT = /run status:/i;

describe("KanbanCard chip gating (SPEC-vibekanban AC-26)", () => {
  it("AC-26: renders the LivenessChip (live) for a non-terminal run with a live driver — and no StatusDot", () => {
    render(
      <KanbanCard
        run={makeLightRun({ status: "waiting", driver: "live", isStale: false })}
      />
    );
    expect(screen.getByText(LIVE_SR_TEXT)).toBeInTheDocument();
    expect(screen.queryByText(STATUS_DOT_SR_TEXT)).not.toBeInTheDocument();
  });

  it("AC-26: renders the LivenessChip (orphaned) for a non-terminal run with no live driver — and no StatusDot", () => {
    render(
      <KanbanCard
        run={makeLightRun({ status: "pending", driver: "none", pendingBreakpoints: 0 })}
      />
    );
    expect(screen.getByText(ORPHANED_SR_TEXT)).toBeInTheDocument();
    expect(screen.queryByText(STATUS_DOT_SR_TEXT)).not.toBeInTheDocument();
  });

  it("AC-26: renders the StatusDot for a terminal (completed) run — and no LivenessChip", () => {
    render(
      <KanbanCard
        run={makeLightRun({ status: "completed", completedTasks: 4, driver: "none" })}
      />
    );
    expect(screen.getByText(STATUS_DOT_SR_TEXT)).toBeInTheDocument();
    expect(screen.queryByText(LIVE_SR_TEXT)).not.toBeInTheDocument();
    expect(screen.queryByText(ORPHANED_SR_TEXT)).not.toBeInTheDocument();
  });

  it("AC-26: renders the StatusDot for a terminal (failed) run — and no LivenessChip", () => {
    render(
      <KanbanCard run={makeLightRun({ status: "failed", failedTasks: 1 })} />
    );
    expect(screen.getByText(STATUS_DOT_SR_TEXT)).toBeInTheDocument();
    expect(screen.queryByText(LIVE_SR_TEXT)).not.toBeInTheDocument();
    expect(screen.queryByText(ORPHANED_SR_TEXT)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// UX-R2 §13.5 — AC-48 (nit): project-tag truncation on the INNER text node.
// Structural half of the AC (the visual ellipsis is asserted in the e2e).
// ---------------------------------------------------------------------------

describe("KanbanCard project tag truncation (UX-R2 §13.5 / AC-48)", () => {
  const LONG_PROJECT_NAME =
    "a-very-long-project-name-that-should-ellipsize-cleanly-01234"; // 60 chars

  it("AC-48: `truncate` sits on the inner text span, the Tag icon stays outside it", () => {
    expect(LONG_PROJECT_NAME).toHaveLength(60);
    render(
      <KanbanCard
        run={makeLightRun({ status: "waiting", projectName: LONG_PROJECT_NAME })}
      />
    );

    const inner = screen.getByTestId("kanban-card-project-name");
    expect(inner).toHaveTextContent(LONG_PROJECT_NAME);
    expect(inner.className).toContain("truncate");
    // The icon is NOT inside the truncated node (it must never be clipped)...
    expect(inner.querySelector("svg")).toBeNull();
    // ...but the flex wrapper still carries icon + text, and can shrink
    // (min-w-0) without truncating itself.
    const wrapper = inner.parentElement as HTMLElement;
    expect(wrapper.querySelector("svg")).not.toBeNull();
    expect(wrapper.className).toContain("min-w-0");
    expect(wrapper.className).not.toContain("truncate");
  });
});

// ---------------------------------------------------------------------------
// Copy-full-run-id affordance — owner UX ask 2026-07: the row-3 short-id
// ("01KX4TCZ") must expose the WHOLE run id (hover title) and copy it on
// click, because resuming needs the full id (babysitter run:iterate <id>).
// ---------------------------------------------------------------------------

describe("KanbanCard row-3 short-id copy affordance", () => {
  const RUN_ID = "01KTESTKANBANCARD0000001"; // makeLightRun default runId
  const SHORT = RUN_ID.slice(0, 8);

  it("shows the truncated short-id with the FULL run id in its title (hover)", () => {
    render(<KanbanCard run={makeLightRun()} />);
    const el = screen.getByText(SHORT);
    expect(el).toHaveAttribute("title", RUN_ID);
  });

  it("clicking the short-id copies the FULL run id to the clipboard", async () => {
    const user = userEvent.setup();
    const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText");
    render(<KanbanCard run={makeLightRun()} />);
    await user.click(screen.getByText(SHORT));
    expect(writeTextSpy).toHaveBeenCalledWith(RUN_ID);
  });
});
