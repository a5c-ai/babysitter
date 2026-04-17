/**
 * terminalNotifications.test.ts
 *
 * Tests for terminal notifications:
 * - buildTabStatusSequence generates correct OSC sequences
 * - mapRunStatusToTabPreset maps statuses to presets
 * - Bell character constant
 *
 * Phase 4: Terminal bell and tab status (Wave 7)
 */

import { describe, it, expect } from "vitest";
import {
  buildTabStatusSequence,
  mapRunStatusToTabPreset,
  TERMINAL_BELL,
} from "../helpers.js";

// ---------------------------------------------------------------------------
// TERMINAL_BELL constant
// ---------------------------------------------------------------------------

describe("TERMINAL_BELL", () => {
  it("is the BEL character (\\x07)", () => {
    expect(TERMINAL_BELL).toBe("\x07");
  });
});

// ---------------------------------------------------------------------------
// buildTabStatusSequence
// ---------------------------------------------------------------------------

describe("buildTabStatusSequence", () => {
  it("returns a string for 'busy' preset", () => {
    const seq = buildTabStatusSequence("busy");
    expect(typeof seq).toBe("string");
    expect(seq.length).toBeGreaterThan(0);
  });

  it("returns a string for 'completed' preset", () => {
    const seq = buildTabStatusSequence("completed");
    expect(typeof seq).toBe("string");
  });

  it("returns a string for 'failed' preset", () => {
    const seq = buildTabStatusSequence("failed");
    expect(typeof seq).toBe("string");
  });

  it("returns a string for 'idle' preset", () => {
    const seq = buildTabStatusSequence("idle");
    expect(typeof seq).toBe("string");
  });

  it("returns a string for 'waiting' preset", () => {
    const seq = buildTabStatusSequence("waiting");
    expect(typeof seq).toBe("string");
  });

  it("contains OSC escape sequence", () => {
    const seq = buildTabStatusSequence("busy");
    // OSC sequences start with ESC ]
    expect(seq.includes("\x1b]") || seq.includes("\x1b[")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// mapRunStatusToTabPreset
// ---------------------------------------------------------------------------

describe("mapRunStatusToTabPreset", () => {
  it("maps 'running' to 'busy' preset", () => {
    const preset = mapRunStatusToTabPreset("running");
    expect(preset).toBe("busy");
  });

  it("maps 'complete' to 'completed' preset", () => {
    const preset = mapRunStatusToTabPreset("complete");
    expect(preset).toBe("completed");
  });

  it("maps 'failed' to 'failed' preset", () => {
    const preset = mapRunStatusToTabPreset("failed");
    expect(preset).toBe("failed");
  });

  it("maps 'idle' to 'idle' preset", () => {
    const preset = mapRunStatusToTabPreset("idle");
    expect(preset).toBe("idle");
  });

  it("maps 'waiting_effect' to 'waiting' preset", () => {
    const preset = mapRunStatusToTabPreset("waiting_effect");
    expect(preset).toBe("waiting");
  });
});

// ---------------------------------------------------------------------------
// Integration: notification on status change
// ---------------------------------------------------------------------------

describe("notification integration", () => {
  it("can compose bell + tab status for complete transition", () => {
    const preset = mapRunStatusToTabPreset("complete");
    const tabSeq = buildTabStatusSequence(preset);
    const notification = TERMINAL_BELL + tabSeq;
    expect(notification.startsWith("\x07")).toBe(true);
    expect(notification.length).toBeGreaterThan(1);
  });

  it("tab status for running differs from idle", () => {
    const busySeq = buildTabStatusSequence(mapRunStatusToTabPreset("running"));
    const idleSeq = buildTabStatusSequence(mapRunStatusToTabPreset("idle"));
    expect(busySeq).not.toBe(idleSeq);
  });
});
