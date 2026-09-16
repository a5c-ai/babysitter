import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import {
  getDriverLiveness,
  deriveLivenessFromActivity,
  parseSleepWakeAt,
  isSleepingScheduled,
  deriveScheduledLiveness,
} from "../liveness";

describe("getDriverLiveness", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "liveness-"));
  });
  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  const writeLock = (obj: unknown) =>
    fs.writeFile(path.join(dir, "run.lock"), JSON.stringify(obj), "utf-8");

  it("returns 'none' when there is no run.lock", async () => {
    expect(await getDriverLiveness(dir)).toBe("none");
  });

  it("returns 'live' when the lock pid is a running process", async () => {
    await writeLock({ pid: process.pid, owner: "test" });
    expect(await getDriverLiveness(dir)).toBe("live");
  });

  it("returns 'orphaned' when the lock pid is dead", async () => {
    // 2^31-1 is a valid-looking pid that will not be running.
    await writeLock({ pid: 2147483646, owner: "test" });
    expect(await getDriverLiveness(dir)).toBe("orphaned");
  });

  it("returns 'orphaned' when the lock has no pid", async () => {
    await writeLock({ owner: "test" });
    expect(await getDriverLiveness(dir)).toBe("orphaned");
  });

  it("returns 'none' on a corrupt lock file", async () => {
    await fs.writeFile(path.join(dir, "run.lock"), "not-json{", "utf-8");
    expect(await getDriverLiveness(dir)).toBe("none");
  });
});

// ---------------------------------------------------------------------------
// UX-R3 wave 3 — journal-activity liveness fallback (deriveLivenessFromActivity).
// Root cause it fixes: 0 of 308 real run dirs carry a run.lock, so the lock
// verdict is permanently "none" and the WORKING column is structurally empty.
// Recent journal activity is the honest in-progress signal that needs no lock.
// ---------------------------------------------------------------------------
describe("deriveLivenessFromActivity", () => {
  const NOW = Date.UTC(2026, 6, 6, 12, 0, 0); // fixed clock
  const FRESHNESS = 3_600_000; // 1h — the stale-threshold window
  const iso = (msAgo: number) => new Date(NOW - msAgo).toISOString();

  it("a fresh non-terminal run with NO lock ('none') is promoted to 'live'", () => {
    // The exact real-world case: no run.lock, but the newest journal event is
    // seconds old → actively progressing.
    expect(deriveLivenessFromActivity("none", iso(30_000), FRESHNESS, NOW)).toBe("live");
  });

  it("a stale run with no lock stays 'none' (still reads as Stalled/Orphaned)", () => {
    // 2h since the last journal event → past the freshness window.
    expect(deriveLivenessFromActivity("none", iso(2 * 3_600_000), FRESHNESS, NOW)).toBe("none");
  });

  it("a live lock is definitive regardless of activity age", () => {
    expect(deriveLivenessFromActivity("live", iso(10 * 3_600_000), FRESHNESS, NOW)).toBe("live");
  });

  it("a dead lock ('orphaned') with stale activity stays 'orphaned'", () => {
    expect(deriveLivenessFromActivity("orphaned", iso(2 * 3_600_000), FRESHNESS, NOW)).toBe("orphaned");
  });

  it("a dead lock ('orphaned') with FRESH activity is promoted to 'live' (recently working)", () => {
    // Fresh journal writes mean work is happening now even if a stale lock lingers.
    expect(deriveLivenessFromActivity("orphaned", iso(30_000), FRESHNESS, NOW)).toBe("live");
  });

  it("the boundary is inclusive: age === freshnessMs still counts as fresh", () => {
    expect(deriveLivenessFromActivity("none", iso(FRESHNESS), FRESHNESS, NOW)).toBe("live");
    expect(deriveLivenessFromActivity("none", iso(FRESHNESS + 1), FRESHNESS, NOW)).toBe("none");
  });

  it("missing/empty updatedAt falls back to the lock verdict", () => {
    expect(deriveLivenessFromActivity("none", undefined, FRESHNESS, NOW)).toBe("none");
    expect(deriveLivenessFromActivity("none", "", FRESHNESS, NOW)).toBe("none");
  });

  it("a future-dated timestamp (clock skew) does not count as fresh", () => {
    // Negative age is rejected so a bogus future ts can't fabricate liveness.
    expect(deriveLivenessFromActivity("none", iso(-60_000), FRESHNESS, NOW)).toBe("none");
  });

  it("a non-positive freshness window disables activity promotion", () => {
    expect(deriveLivenessFromActivity("none", iso(1), 0, NOW)).toBe("none");
  });
});

// ---------------------------------------------------------------------------
// §15.1 (owner gate 2026-07-06b, model A) — scheduled (sleeping forever-run)
// detection. Pure helpers, now-injectable (AC-83).
// ---------------------------------------------------------------------------

describe("parseSleepWakeAt (§15.1 AC-83)", () => {
  it("parses sleep:<ISO> out of the label", () => {
    expect(parseSleepWakeAt("sleep:2026-07-06T03:00:00.000Z", undefined)).toBe(
      "2026-07-06T03:00:00.000Z"
    );
  });
  it("parses sleep:<ISO> out of the stepId when the label lacks it", () => {
    expect(parseSleepWakeAt("nightly-finalize", "sleep:2026-07-06T03:00:00.000Z")).toBe(
      "2026-07-06T03:00:00.000Z"
    );
  });
  it("returns null when no field carries a parseable sleep token", () => {
    expect(parseSleepWakeAt("just a label", "step-1")).toBeNull();
    expect(parseSleepWakeAt(undefined, undefined)).toBeNull();
    expect(parseSleepWakeAt("sleep:not-a-date", undefined)).toBeNull();
  });
});

describe("isSleepingScheduled (§15.1 AC-83)", () => {
  it("true only when the newest event is an EFFECT_REQUESTED of kind sleep", () => {
    expect(isSleepingScheduled({ type: "EFFECT_REQUESTED", kind: "sleep" })).toBe(true);
  });
  it("false for a resolved sleep (newest event is EFFECT_RESOLVED)", () => {
    expect(isSleepingScheduled({ type: "EFFECT_RESOLVED", kind: "sleep" })).toBe(false);
  });
  it("false for a non-sleep requested effect and for undefined", () => {
    expect(isSleepingScheduled({ type: "EFFECT_REQUESTED", kind: "agent" })).toBe(false);
    expect(isSleepingScheduled(undefined)).toBe(false);
  });
});

describe("deriveScheduledLiveness (§15.1 AC-83/86)", () => {
  const sleeping = { type: "EFFECT_REQUESTED", kind: "sleep" };
  it("returns 'scheduled' over the no-lock 'none' fallback", () => {
    expect(deriveScheduledLiveness("none", sleeping)).toBe("scheduled");
  });
  it("returns 'scheduled' over a dead-lock 'orphaned' verdict", () => {
    expect(deriveScheduledLiveness("orphaned", sleeping)).toBe("scheduled");
  });
  it("a genuinely live lock still wins (attached orchestrator mid-sleep)", () => {
    expect(deriveScheduledLiveness("live", sleeping)).toBeNull();
  });
  it("returns null when the newest event is not a sleep effect", () => {
    expect(deriveScheduledLiveness("none", { type: "EFFECT_RESOLVED", kind: "sleep" })).toBeNull();
  });
});
