/**
 * TOOLS-028: Sleep effect tests.
 */

import { describe, it, expect } from "vitest";
import {
  parseSleepTarget,
  createSleepEffect,
  isExpired,
} from "../sleepEffect";

const NOW = 1_000_000_000;

// ---------------------------------------------------------------------------
// parseSleepTarget
// ---------------------------------------------------------------------------

describe("parseSleepTarget", () => {
  it("parses seconds", () => {
    const target = parseSleepTarget("30s", NOW);
    expect(target).toBeDefined();
    expect(target!.wakeAt).toBe(NOW + 30_000);
    expect(target!.isAbsolute).toBe(false);
  });

  it("parses minutes", () => {
    const target = parseSleepTarget("5m", NOW);
    expect(target!.wakeAt).toBe(NOW + 5 * 60_000);
  });

  it("parses hours", () => {
    const target = parseSleepTarget("2h", NOW);
    expect(target!.wakeAt).toBe(NOW + 2 * 3_600_000);
  });

  it("parses days", () => {
    const target = parseSleepTarget("1d", NOW);
    expect(target!.wakeAt).toBe(NOW + 86_400_000);
  });

  it("parses verbose units", () => {
    expect(parseSleepTarget("10 seconds", NOW)!.wakeAt).toBe(NOW + 10_000);
    expect(parseSleepTarget("3 minutes", NOW)!.wakeAt).toBe(NOW + 3 * 60_000);
    expect(parseSleepTarget("1 hour", NOW)!.wakeAt).toBe(NOW + 3_600_000);
  });

  it("parses ISO 8601 timestamps", () => {
    const iso = "2026-06-03T15:30:00Z";
    const target = parseSleepTarget(iso, NOW);
    expect(target).toBeDefined();
    expect(target!.wakeAt).toBe(Date.parse(iso));
    expect(target!.isAbsolute).toBe(true);
  });

  it("returns undefined for empty input", () => {
    expect(parseSleepTarget("")).toBeUndefined();
    expect(parseSleepTarget("  ")).toBeUndefined();
  });

  it("returns undefined for unparseable input", () => {
    expect(parseSleepTarget("not-a-duration")).toBeUndefined();
    expect(parseSleepTarget("5x")).toBeUndefined();
  });

  it("preserves raw input", () => {
    const target = parseSleepTarget("30s", NOW);
    expect(target!.raw).toBe("30s");
  });

  it("handles fractional amounts", () => {
    const target = parseSleepTarget("1.5h", NOW);
    expect(target!.wakeAt).toBe(NOW + 1.5 * 3_600_000);
  });
});

// ---------------------------------------------------------------------------
// createSleepEffect
// ---------------------------------------------------------------------------

describe("createSleepEffect", () => {
  it("creates a sleep effect from a target", () => {
    const target = parseSleepTarget("10s", NOW)!;
    const effect = createSleepEffect(target, NOW);

    expect(effect.kind).toBe("sleep");
    expect(effect.wakeAt).toBe(target.wakeAt);
    expect(effect.raw).toBe("10s");
    expect(effect.createdAt).toBe(NOW);
  });
});

// ---------------------------------------------------------------------------
// isExpired
// ---------------------------------------------------------------------------

describe("isExpired", () => {
  it("returns false before wake time", () => {
    const target = parseSleepTarget("10s", NOW)!;
    const effect = createSleepEffect(target, NOW);
    expect(isExpired(effect, NOW + 5_000)).toBe(false);
  });

  it("returns true at wake time", () => {
    const target = parseSleepTarget("10s", NOW)!;
    const effect = createSleepEffect(target, NOW);
    expect(isExpired(effect, NOW + 10_000)).toBe(true);
  });

  it("returns true after wake time", () => {
    const target = parseSleepTarget("10s", NOW)!;
    const effect = createSleepEffect(target, NOW);
    expect(isExpired(effect, NOW + 20_000)).toBe(true);
  });
});
