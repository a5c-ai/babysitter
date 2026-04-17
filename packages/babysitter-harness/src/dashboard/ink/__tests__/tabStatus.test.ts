/**
 * tabStatus.test.ts
 *
 * Tests for terminal tab status OSC sequence builders.
 */

import { describe, it, expect } from "vitest";
import {
  buildTabStatusSequence,
  mapRunStatusToTabPreset,
} from "../helpers.js";
import type { RunStatus } from "../types.js";

describe("buildTabStatusSequence", () => {
  it("returns valid OSC sequence for idle preset", () => {
    const seq = buildTabStatusSequence("idle");
    expect(seq).toMatch(/^\x1b\]/);  // starts with OSC
    expect(seq).toMatch(/\x07$/);    // ends with BEL
  });

  it("returns valid OSC sequence for busy preset", () => {
    const seq = buildTabStatusSequence("busy");
    expect(seq).toMatch(/^\x1b\]/);
    expect(seq).toMatch(/\x07$/);
  });

  it("returns valid OSC sequence for waiting preset", () => {
    const seq = buildTabStatusSequence("waiting");
    expect(seq).toMatch(/^\x1b\]/);
    expect(seq).toMatch(/\x07$/);
  });

  it("different presets produce different sequences", () => {
    const idle = buildTabStatusSequence("idle");
    const busy = buildTabStatusSequence("busy");
    const waiting = buildTabStatusSequence("waiting");
    expect(idle).not.toBe(busy);
    expect(busy).not.toBe(waiting);
  });
});

describe("mapRunStatusToTabPreset", () => {
  it("maps idle status to idle preset", () => {
    expect(mapRunStatusToTabPreset("idle")).toBe("idle");
  });

  it("maps running status to busy preset", () => {
    expect(mapRunStatusToTabPreset("running")).toBe("busy");
  });

  it("maps waiting_effect status to waiting preset", () => {
    expect(mapRunStatusToTabPreset("waiting_effect")).toBe("waiting");
  });

  it("maps complete status to completed preset", () => {
    expect(mapRunStatusToTabPreset("complete")).toBe("completed");
  });

  it("maps failed status to failed preset", () => {
    expect(mapRunStatusToTabPreset("failed")).toBe("failed");
  });

  it("handles all RunStatus values", () => {
    const statuses: RunStatus[] = ["idle", "running", "waiting_effect", "complete", "failed"];
    for (const s of statuses) {
      expect(typeof mapRunStatusToTabPreset(s)).toBe("string");
    }
  });
});
