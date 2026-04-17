/**
 * runDetail.test.ts
 *
 * Tests for RunDetailView data formatting pipeline.
 * Verifies event type formatting, event icons/colors, and timeline display.
 */

import { describe, it, expect } from "vitest";
import type { ThemeColors } from "../types.js";
import {
  formatEventType,
  getEventIcon,
  getEventColor,
  formatEventTimeline,
} from "../helpers.js";

// ---------------------------------------------------------------------------
// Test fixture
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

const EVENT_TYPES = [
  "RUN_CREATED",
  "EFFECT_REQUESTED",
  "EFFECT_RESOLVED",
  "RUN_COMPLETED",
  "RUN_FAILED",
] as const;

// ---------------------------------------------------------------------------
// formatEventType
// ---------------------------------------------------------------------------

describe("formatEventType", () => {
  for (const type of EVENT_TYPES) {
    it(`returns a human-readable label for "${type}"`, () => {
      const label = formatEventType(type);
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
      // Should not just return the raw type unchanged
      expect(label).not.toBe(type);
    });
  }

  it("returns the raw type for unknown event types", () => {
    const label = formatEventType("UNKNOWN_TYPE");
    expect(label).toBe("UNKNOWN_TYPE");
  });

  it("Run Created label is user-friendly", () => {
    expect(formatEventType("RUN_CREATED")).toContain("Created");
  });

  it("Run Completed label is user-friendly", () => {
    expect(formatEventType("RUN_COMPLETED")).toContain("Completed");
  });

  it("Run Failed label is user-friendly", () => {
    expect(formatEventType("RUN_FAILED")).toContain("Failed");
  });
});

// ---------------------------------------------------------------------------
// getEventIcon
// ---------------------------------------------------------------------------

describe("getEventIcon", () => {
  for (const type of EVENT_TYPES) {
    it(`returns a non-empty icon for "${type}"`, () => {
      const icon = getEventIcon(type);
      expect(typeof icon).toBe("string");
      expect(icon.length).toBeGreaterThan(0);
    });
  }

  it("returns a fallback icon for unknown types", () => {
    const icon = getEventIcon("SOMETHING_ELSE");
    expect(typeof icon).toBe("string");
    expect(icon.length).toBeGreaterThan(0);
  });

  it("completed and failed have different icons", () => {
    expect(getEventIcon("RUN_COMPLETED")).not.toBe(getEventIcon("RUN_FAILED"));
  });
});

// ---------------------------------------------------------------------------
// getEventColor
// ---------------------------------------------------------------------------

describe("getEventColor", () => {
  it("returns success color for RUN_COMPLETED", () => {
    expect(getEventColor("RUN_COMPLETED", mockColors)).toBe(mockColors.success);
  });

  it("returns error color for RUN_FAILED", () => {
    expect(getEventColor("RUN_FAILED", mockColors)).toBe(mockColors.error);
  });

  it("returns primary color for RUN_CREATED", () => {
    expect(getEventColor("RUN_CREATED", mockColors)).toBe(mockColors.primary);
  });

  it("returns warning color for EFFECT_REQUESTED", () => {
    expect(getEventColor("EFFECT_REQUESTED", mockColors)).toBe(mockColors.warning);
  });

  it("returns success color for EFFECT_RESOLVED", () => {
    expect(getEventColor("EFFECT_RESOLVED", mockColors)).toBe(mockColors.success);
  });

  it("returns muted for unknown event types", () => {
    expect(getEventColor("UNKNOWN", mockColors)).toBe(mockColors.muted);
  });
});

// ---------------------------------------------------------------------------
// formatEventTimeline
// ---------------------------------------------------------------------------

describe("formatEventTimeline", () => {
  const events = [
    { type: "RUN_CREATED", recordedAt: "2026-04-10T10:00:00.000Z", seq: 1 },
    { type: "EFFECT_REQUESTED", recordedAt: "2026-04-10T10:00:01.000Z", seq: 2 },
    { type: "EFFECT_RESOLVED", recordedAt: "2026-04-10T10:00:05.000Z", seq: 3 },
    { type: "RUN_COMPLETED", recordedAt: "2026-04-10T10:00:10.000Z", seq: 4 },
  ];

  it("returns one line per event", () => {
    const lines = formatEventTimeline(events);
    expect(lines.length).toBe(events.length);
  });

  it("each line contains the event type label", () => {
    const lines = formatEventTimeline(events);
    expect(lines[0]).toContain("Created");
    expect(lines[1]).toContain("Requested");
    expect(lines[2]).toContain("Resolved");
    expect(lines[3]).toContain("Completed");
  });

  it("each line contains a timestamp", () => {
    const lines = formatEventTimeline(events);
    for (const line of lines) {
      // Should contain time portion (HH:MM:SS pattern)
      expect(line).toMatch(/\d{2}:\d{2}/);
    }
  });

  it("each line contains the sequence number", () => {
    const lines = formatEventTimeline(events);
    expect(lines[0]).toContain("#1");
    expect(lines[3]).toContain("#4");
  });

  it("handles empty events array", () => {
    const lines = formatEventTimeline([]);
    expect(lines).toEqual([]);
  });

  it("handles single event", () => {
    const lines = formatEventTimeline([events[0]]);
    expect(lines.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Pipeline integration
// ---------------------------------------------------------------------------

describe("run detail formatting pipeline", () => {
  it("all event types have consistent icon + color + label", () => {
    for (const type of EVENT_TYPES) {
      const label = formatEventType(type);
      const icon = getEventIcon(type);
      const color = getEventColor(type, mockColors);

      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
      expect(typeof icon).toBe("string");
      expect(icon.length).toBeGreaterThan(0);
      expect(typeof color).toBe("string");
      expect(color.startsWith("#")).toBe(true);
    }
  });

  it("timeline lines use formatEventType internally", () => {
    const events = [
      { type: "RUN_FAILED", recordedAt: "2026-04-10T10:00:00.000Z", seq: 1 },
    ];
    const lines = formatEventTimeline(events);
    const label = formatEventType("RUN_FAILED");
    expect(lines[0]).toContain(label);
  });
});
