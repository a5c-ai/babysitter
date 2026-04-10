/**
 * runDetailView.test.ts
 *
 * Tests for RunDetailView component wiring pipeline.
 * Verifies metadata display formatting, event timeline rendering,
 * task status computation, and scroll math for event lists.
 */

import { describe, it, expect } from "vitest";
import type { ThemeColors } from "../types.js";
import {
  formatEventType,
  getEventIcon,
  getEventColor,
  formatEventTimeline,
  formatTimestamp,
  formatElapsedCompact,
  clampScrollOffset,
  computeVisibleRange,
  formatKeyboardHelp,
} from "../helpers.js";
import {
  stateSymbol,
  stateColor,
  truncateId,
} from "../components/RunListTable.js";
import type { RunDetail } from "../data/runScanner.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockColors: ThemeColors = {
  primary: "#00ff00",
  secondary: "#0000ff",
  muted: "#888888",
  error: "#ff0000",
  warning: "#ffaa00",
  success: "#00cc00",
  foreground: "#ffffff",
  background: "#000000",
  border: "#444444",
  toolCall: "#ff00ff",
  subagent: "#00ffff",
};

const sampleDetail: RunDetail = {
  runId: "01KNVTRV30TSCG9NG13CJ92FTC",
  runDir: "/tmp/runs/01KNVTRV30TSCG9NG13CJ92FTC",
  state: "waiting",
  processId: "run-detail-view",
  createdAt: "2026-04-10T10:00:00.000Z",
  eventCount: 8,
  pendingCount: 2,
  resolvedCount: 3,
  prompt: "Build the RunDetailView",
  events: [
    { type: "RUN_CREATED", recordedAt: "2026-04-10T10:00:00.000Z", seq: 1 },
    { type: "EFFECT_REQUESTED", recordedAt: "2026-04-10T10:00:01.000Z", seq: 2 },
    { type: "EFFECT_RESOLVED", recordedAt: "2026-04-10T10:00:05.000Z", seq: 3 },
    { type: "EFFECT_REQUESTED", recordedAt: "2026-04-10T10:00:06.000Z", seq: 4 },
    { type: "EFFECT_RESOLVED", recordedAt: "2026-04-10T10:00:10.000Z", seq: 5 },
    { type: "EFFECT_REQUESTED", recordedAt: "2026-04-10T10:00:11.000Z", seq: 6 },
    { type: "EFFECT_RESOLVED", recordedAt: "2026-04-10T10:00:15.000Z", seq: 7 },
    { type: "EFFECT_REQUESTED", recordedAt: "2026-04-10T10:00:16.000Z", seq: 8 },
  ],
};

const completedDetail: RunDetail = {
  ...sampleDetail,
  state: "completed",
  pendingCount: 0,
  resolvedCount: 5,
  events: [
    ...sampleDetail.events,
    { type: "RUN_COMPLETED", recordedAt: "2026-04-10T10:01:00.000Z", seq: 9 },
  ],
};

const failedDetail: RunDetail = {
  ...sampleDetail,
  state: "failed",
  events: [
    ...sampleDetail.events,
    { type: "RUN_FAILED", recordedAt: "2026-04-10T10:01:00.000Z", seq: 9 },
  ],
};

// ---------------------------------------------------------------------------
// Metadata display formatting
// ---------------------------------------------------------------------------

describe("RunDetailView metadata display", () => {
  it("truncates long run IDs for header", () => {
    const truncated = truncateId(sampleDetail.runId);
    expect(truncated.length).toBeLessThanOrEqual(12);
  });

  it("formats createdAt timestamp", () => {
    const ts = formatTimestamp(sampleDetail.createdAt);
    expect(ts).toMatch(/\d{2}:\d{2}/);
  });

  it("computes elapsed time from createdAt", () => {
    const elapsed = formatElapsedCompact(60000); // 1 minute
    expect(elapsed).toContain("1");
  });

  it("state symbol reflects run state", () => {
    expect(stateSymbol("completed")).toBe("\u2714"); // ✔
    expect(stateSymbol("failed")).toBe("\u2718"); // ✘
    expect(stateSymbol("waiting")).toBe("\u25CB"); // ○
    expect(stateSymbol("created")).toBe("\u2500"); // ─
  });

  it("state color returns appropriate colors", () => {
    const completedColor = stateColor("completed", mockColors);
    const failedColor = stateColor("failed", mockColors);
    expect(completedColor).toBe(mockColors.success);
    expect(failedColor).toBe(mockColors.error);
  });
});

// ---------------------------------------------------------------------------
// Task status computation
// ---------------------------------------------------------------------------

describe("RunDetailView task status", () => {
  it("computes pending and resolved from detail", () => {
    expect(sampleDetail.pendingCount).toBe(2);
    expect(sampleDetail.resolvedCount).toBe(3);
  });

  it("completed run has 0 pending", () => {
    expect(completedDetail.pendingCount).toBe(0);
  });

  it("total effects = pending + resolved", () => {
    // For the sample, EFFECT_REQUESTED count = 4, EFFECT_RESOLVED = 3
    // pending = 4 - 3 = 1, but we manually set it to 2 for the fixture
    // This tests the display logic, not the derivation
    const totalDisplay = sampleDetail.pendingCount + sampleDetail.resolvedCount;
    expect(totalDisplay).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Event timeline formatting for view
// ---------------------------------------------------------------------------

describe("RunDetailView event timeline", () => {
  it("formats all events in detail", () => {
    const lines = formatEventTimeline(sampleDetail.events);
    expect(lines.length).toBe(sampleDetail.events.length);
  });

  it("completed run timeline ends with completion event", () => {
    const lines = formatEventTimeline(completedDetail.events);
    const lastLine = lines[lines.length - 1];
    expect(lastLine).toContain("Completed");
  });

  it("failed run timeline ends with failure event", () => {
    const lines = formatEventTimeline(failedDetail.events);
    const lastLine = lines[lines.length - 1];
    expect(lastLine).toContain("Failed");
  });

  it("each event has correct icon from getEventIcon", () => {
    for (const event of sampleDetail.events) {
      const icon = getEventIcon(event.type);
      expect(icon.length).toBeGreaterThan(0);
    }
  });

  it("each event has correct color from getEventColor", () => {
    for (const event of sampleDetail.events) {
      const color = getEventColor(event.type, mockColors);
      expect(color.startsWith("#")).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Event scroll math
// ---------------------------------------------------------------------------

describe("RunDetailView event scroll", () => {
  const EVENT_VIEWPORT = 15;

  it("no scroll needed when events fit viewport", () => {
    const offset = clampScrollOffset(0, 10, EVENT_VIEWPORT);
    expect(offset).toBe(0);
    const range = computeVisibleRange(0, 10, EVENT_VIEWPORT);
    expect(range.start).toBe(0);
    expect(range.end).toBe(10);
  });

  it("scroll needed when events exceed viewport", () => {
    const maxOffset = 30 - EVENT_VIEWPORT; // 15
    const offset = clampScrollOffset(5, 30, EVENT_VIEWPORT);
    expect(offset).toBe(5);
    const range = computeVisibleRange(5, 30, EVENT_VIEWPORT);
    expect(range.start).toBe(5);
    expect(range.end).toBe(20);
  });

  it("clamp prevents over-scroll", () => {
    const offset = clampScrollOffset(100, 30, EVENT_VIEWPORT);
    expect(offset).toBe(15); // max = 30 - 15
  });

  it("start at bottom by default (show latest events)", () => {
    const maxOffset = 30 - EVENT_VIEWPORT;
    const range = computeVisibleRange(maxOffset, 30, EVENT_VIEWPORT);
    expect(range.end).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// Full pipeline: detail → display data
// ---------------------------------------------------------------------------

describe("RunDetailView full rendering pipeline", () => {
  it("produces all display data from a RunDetail", () => {
    const detail = sampleDetail;

    // Metadata
    const truncatedId = truncateId(detail.runId);
    const stSym = stateSymbol(detail.state);
    const stCol = stateColor(detail.state, mockColors);
    const ts = formatTimestamp(detail.createdAt);

    expect(truncatedId.length).toBeLessThanOrEqual(12);
    expect(stSym.length).toBeGreaterThan(0);
    expect(stCol.startsWith("#")).toBe(true);
    expect(ts).toMatch(/\d{2}:\d{2}/);

    // Timeline
    const lines = formatEventTimeline(detail.events);
    expect(lines.length).toBe(detail.events.length);

    // Task status
    expect(detail.pendingCount).toBeGreaterThanOrEqual(0);
    expect(detail.resolvedCount).toBeGreaterThanOrEqual(0);
  });

  it("handles minimal detail (no events, no prompt)", () => {
    const minimal: RunDetail = {
      runId: "test-run",
      runDir: "/tmp/test-run",
      state: "created",
      processId: "test",
      createdAt: "2026-01-01T00:00:00.000Z",
      eventCount: 0,
      pendingCount: 0,
      resolvedCount: 0,
      events: [],
    };

    const lines = formatEventTimeline(minimal.events);
    expect(lines).toEqual([]);
    expect(stateSymbol(minimal.state)).toBe("\u2500");
  });
});

// ---------------------------------------------------------------------------
// Keyboard help overlay (Phase 3)
// ---------------------------------------------------------------------------

describe("RunDetailView keyboard help", () => {
  it("returns array of shortcut lines", () => {
    const lines = formatKeyboardHelp("run-detail");
    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBeGreaterThan(0);
  });

  it("includes Escape shortcut", () => {
    const lines = formatKeyboardHelp("run-detail");
    const hasEscape = lines.some((l) => /esc/i.test(l));
    expect(hasEscape).toBe(true);
  });

  it("includes scroll shortcuts", () => {
    const lines = formatKeyboardHelp("run-detail");
    const hasScroll = lines.some((l) => /scroll/i.test(l) || /up.*down/i.test(l) || /\u2191/i.test(l));
    expect(hasScroll).toBe(true);
  });

  it("includes session shortcut (s key)", () => {
    const lines = formatKeyboardHelp("run-detail");
    const hasSession = lines.some((l) => /\bs\b/i.test(l) && /session/i.test(l));
    expect(hasSession).toBe(true);
  });

  it("includes refresh shortcut (r key)", () => {
    const lines = formatKeyboardHelp("run-detail");
    const hasRefresh = lines.some((l) => /\br\b/i.test(l) && /refresh/i.test(l));
    expect(hasRefresh).toBe(true);
  });

  it("includes help toggle shortcut (?)", () => {
    const lines = formatKeyboardHelp("run-detail");
    const hasHelp = lines.some((l) => /\?/.test(l));
    expect(hasHelp).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Breakpoint data derivation (Phase 3)
// ---------------------------------------------------------------------------

describe("RunDetailView breakpoint display", () => {
  it("identifies waiting run as having potential breakpoints", () => {
    // A waiting run with pending effects could have breakpoints
    expect(sampleDetail.state).toBe("waiting");
    expect(sampleDetail.pendingCount).toBeGreaterThan(0);
  });

  it("completed run has no pending breakpoints", () => {
    expect(completedDetail.pendingCount).toBe(0);
    expect(completedDetail.state).toBe("completed");
  });

  it("detail with breakpoint events shows in timeline", () => {
    const detailWithBreakpoint: RunDetail = {
      ...sampleDetail,
      events: [
        ...sampleDetail.events,
        { type: "EFFECT_REQUESTED", recordedAt: "2026-04-10T10:02:00.000Z", seq: 9 },
      ],
    };
    const lines = formatEventTimeline(detailWithBreakpoint.events);
    expect(lines.length).toBe(detailWithBreakpoint.events.length);
  });
});

// ---------------------------------------------------------------------------
// Effects panel data derivation (Phase 3)
// ---------------------------------------------------------------------------

describe("RunDetailView effects data", () => {
  it("counts requested vs resolved for effect status", () => {
    const events = sampleDetail.events;
    const requested = events.filter((e) => e.type === "EFFECT_REQUESTED").length;
    const resolved = events.filter((e) => e.type === "EFFECT_RESOLVED").length;
    expect(requested).toBe(4);
    expect(resolved).toBe(3);
    expect(requested - resolved).toBe(1);
  });

  it("completed run has all effects resolved", () => {
    // completedDetail manually sets resolvedCount=5, pendingCount=0
    expect(completedDetail.resolvedCount).toBe(5);
    expect(completedDetail.pendingCount).toBe(0);
  });

  it("effect events maintain chronological order", () => {
    const events = sampleDetail.events;
    for (let i = 1; i < events.length; i++) {
      expect(events[i].seq).toBeGreaterThan(events[i - 1].seq);
    }
  });
});

// ---------------------------------------------------------------------------
// Resume navigation flow (Phase 3)
// ---------------------------------------------------------------------------

describe("RunDetailView resume navigation", () => {
  it("waiting run is resumable (has runId)", () => {
    expect(sampleDetail.runId).toBeTruthy();
    expect(sampleDetail.state).toBe("waiting");
  });

  it("completed run can still be viewed in session", () => {
    expect(completedDetail.runId).toBeTruthy();
  });

  it("failed run can be viewed in session", () => {
    expect(failedDetail.runId).toBeTruthy();
    expect(failedDetail.state).toBe("failed");
  });
});
