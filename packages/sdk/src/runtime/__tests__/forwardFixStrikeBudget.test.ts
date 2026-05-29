import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import path from "path";
import os from "os";
import { promises as fs } from "fs";
import { createRun } from "../createRun";
import { readRunMetadata } from "../../storage/runFiles";
import { createReplayEngine } from "../replay/createReplayEngine";
import { createProcessContext } from "../processContext";
import { ReplayCursor } from "../replay/replayCursor";
import { EffectIndex } from "../replay/effectIndex";
import {
  createStrikeTracker,
  normalizeStrikeBudget,
  DEFAULT_STRIKE_BUDGET_PER_BUG_CLASS,
  DEFAULT_STRIKE_BUDGET_PIVOT_PHASE,
} from "../strikeTracker";
import * as ulids from "../../storage/ulids";

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sdk-strike-budget-"));
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

function effectIndexStub(): EffectIndex {
  return {} as EffectIndex;
}

describe("forwardFixStrikeBudget — metadata persistence", () => {
  test("persists budget to run.json and reads it via createReplayEngine", async () => {
    vi.spyOn(ulids, "nextUlid").mockReturnValue("01HZWSTRIKE0001");
    const entryFile = path.join(tmpRoot, "processes", "p.mjs");
    await fs.mkdir(path.dirname(entryFile), { recursive: true });
    await fs.writeFile(entryFile, "export async function process() { return 'ok'; }");

    const result = await createRun({
      runsDir: tmpRoot,
      process: {
        processId: "ci/strike-test",
        importPath: entryFile,
      },
      forwardFixStrikeBudget: {
        perBugClass: 3,
        pivotPhase: "verbose-logs",
        instrumentationTemplate: "verbose-logs.preview",
      },
    });

    const metadata = await readRunMetadata(result.runDir);
    expect(metadata.forwardFixStrikeBudget).toEqual({
      perBugClass: 3,
      pivotPhase: "verbose-logs",
      instrumentationTemplate: "verbose-logs.preview",
    });

    const engine = await createReplayEngine({ runDir: result.runDir });
    expect(engine.internalContext.forwardFixStrikeBudget).toEqual({
      perBugClass: 3,
      pivotPhase: "verbose-logs",
      instrumentationTemplate: "verbose-logs.preview",
    });
    expect(engine.internalContext.strikeTracker).toBeDefined();
    expect(engine.internalContext.strikeTracker?.budget.perBugClass).toBe(3);
  });

  test("omits forwardFixStrikeBudget from run.json when not provided", async () => {
    vi.spyOn(ulids, "nextUlid").mockReturnValue("01HZWSTRIKE0002");
    const entryFile = path.join(tmpRoot, "processes", "p.mjs");
    await fs.mkdir(path.dirname(entryFile), { recursive: true });
    await fs.writeFile(entryFile, "export async function process() {}");

    const result = await createRun({
      runsDir: tmpRoot,
      process: {
        processId: "ci/strike-omit",
        importPath: entryFile,
      },
    });

    const metadata = await readRunMetadata(result.runDir);
    expect(metadata.forwardFixStrikeBudget).toBeUndefined();

    const engine = await createReplayEngine({ runDir: result.runDir });
    expect(engine.internalContext.forwardFixStrikeBudget).toBeUndefined();
    expect(engine.internalContext.strikeTracker).toBeUndefined();
  });

  test("normalizes minimal config with defaults", async () => {
    vi.spyOn(ulids, "nextUlid").mockReturnValue("01HZWSTRIKE0003");
    const entryFile = path.join(tmpRoot, "processes", "p.mjs");
    await fs.mkdir(path.dirname(entryFile), { recursive: true });
    await fs.writeFile(entryFile, "export async function process() {}");

    const result = await createRun({
      runsDir: tmpRoot,
      process: {
        processId: "ci/strike-min",
        importPath: entryFile,
      },
      forwardFixStrikeBudget: { perBugClass: 2 },
    });

    const metadata = await readRunMetadata(result.runDir);
    expect(metadata.forwardFixStrikeBudget).toEqual({ perBugClass: 2 });

    const engine = await createReplayEngine({ runDir: result.runDir });
    // The replay engine fills in defaults via normalizeStrikeBudget.
    expect(engine.internalContext.forwardFixStrikeBudget).toEqual({
      perBugClass: 2,
      pivotPhase: DEFAULT_STRIKE_BUDGET_PIVOT_PHASE,
    });
  });
});

describe("normalizeStrikeBudget", () => {
  test("applies default perBugClass when missing", () => {
    expect(normalizeStrikeBudget(undefined as never)).toEqual({
      perBugClass: DEFAULT_STRIKE_BUDGET_PER_BUG_CLASS,
      pivotPhase: DEFAULT_STRIKE_BUDGET_PIVOT_PHASE,
    });
  });

  test("clamps non-positive perBugClass to default", () => {
    expect(normalizeStrikeBudget({ perBugClass: 0 } as never)).toEqual({
      perBugClass: DEFAULT_STRIKE_BUDGET_PER_BUG_CLASS,
      pivotPhase: DEFAULT_STRIKE_BUDGET_PIVOT_PHASE,
    });
    expect(normalizeStrikeBudget({ perBugClass: -1 } as never)).toEqual({
      perBugClass: DEFAULT_STRIKE_BUDGET_PER_BUG_CLASS,
      pivotPhase: DEFAULT_STRIKE_BUDGET_PIVOT_PHASE,
    });
  });

  test("preserves valid pivotPhase and instrumentationTemplate", () => {
    expect(
      normalizeStrikeBudget({
        perBugClass: 5,
        pivotPhase: "diagnose",
        instrumentationTemplate: "tracing.preview",
      })
    ).toEqual({
      perBugClass: 5,
      pivotPhase: "diagnose",
      instrumentationTemplate: "tracing.preview",
    });
  });

  test("floors fractional perBugClass to integer", () => {
    expect(normalizeStrikeBudget({ perBugClass: 2.7 } as never).perBugClass).toBe(2);
  });
});

describe("StrikeTracker semantics", () => {
  test("counts increment per bugClass and exhaust at the budget", () => {
    const tracker = createStrikeTracker({ perBugClass: 2 });

    expect(tracker.get("a")).toBe(0);
    expect(tracker.isExhausted("a")).toBe(false);

    expect(tracker.recordFailure("a")).toBe(1);
    expect(tracker.isExhausted("a")).toBe(false);

    expect(tracker.recordFailure("a")).toBe(2);
    expect(tracker.isExhausted("a")).toBe(true);

    // Third strike continues incrementing but stays exhausted.
    expect(tracker.recordFailure("a")).toBe(3);
    expect(tracker.isExhausted("a")).toBe(true);
  });

  test("different bugClass values count independently", () => {
    const tracker = createStrikeTracker({ perBugClass: 2 });
    tracker.recordFailure("a");
    tracker.recordFailure("a");
    tracker.recordFailure("b");

    expect(tracker.isExhausted("a")).toBe(true);
    expect(tracker.isExhausted("b")).toBe(false);
    expect(tracker.get("b")).toBe(1);
  });

  test("reset clears the strike count for a single bugClass", () => {
    const tracker = createStrikeTracker({ perBugClass: 2 });
    tracker.recordFailure("a");
    tracker.recordFailure("a");
    expect(tracker.isExhausted("a")).toBe(true);

    tracker.reset("a");
    expect(tracker.get("a")).toBe(0);
    expect(tracker.isExhausted("a")).toBe(false);
  });

  test("recordEffectFailure dedupes by effectId", () => {
    const tracker = createStrikeTracker({ perBugClass: 5 });
    expect(tracker.recordEffectFailure("a", "eff-1")).toBe(true);
    expect(tracker.recordEffectFailure("a", "eff-1")).toBe(false);
    expect(tracker.get("a")).toBe(1);

    expect(tracker.recordEffectFailure("a", "eff-2")).toBe(true);
    expect(tracker.get("a")).toBe(2);
    expect(tracker.hasRecordedEffect("eff-2")).toBe(true);
    expect(tracker.hasRecordedEffect("eff-3")).toBe(false);
  });

  test("invalid bugClass values are no-ops", () => {
    const tracker = createStrikeTracker({ perBugClass: 2 });
    expect(tracker.recordFailure("")).toBe(0);
    expect(tracker.recordFailure(null as unknown as string)).toBe(0);
    expect(tracker.isExhausted("")).toBe(false);
    expect(tracker.get(null as unknown as string)).toBe(0);
  });
});

describe("createProcessContext — strike tracker wiring", () => {
  test("builds a strike tracker from budget config", () => {
    const { internalContext } = createProcessContext({
      runId: "run-strike-1",
      runDir: "/tmp/run-strike-1",
      processId: "proc",
      effectIndex: effectIndexStub(),
      replayCursor: new ReplayCursor(),
      forwardFixStrikeBudget: { perBugClass: 3 },
    });
    expect(internalContext.forwardFixStrikeBudget).toEqual({
      perBugClass: 3,
      pivotPhase: DEFAULT_STRIKE_BUDGET_PIVOT_PHASE,
    });
    expect(internalContext.strikeTracker).toBeDefined();
    expect(internalContext.strikeTracker?.budget.perBugClass).toBe(3);
  });

  test("reuses a pre-built tracker when supplied", () => {
    const preBuilt = createStrikeTracker({ perBugClass: 2 });
    preBuilt.recordFailure("x");
    preBuilt.recordFailure("x");

    const { internalContext } = createProcessContext({
      runId: "run-strike-2",
      runDir: "/tmp/run-strike-2",
      processId: "proc",
      effectIndex: effectIndexStub(),
      replayCursor: new ReplayCursor(),
      forwardFixStrikeBudget: { perBugClass: 2 },
      strikeTracker: preBuilt,
    });
    expect(internalContext.strikeTracker).toBe(preBuilt);
    expect(internalContext.strikeTracker?.isExhausted("x")).toBe(true);
  });

  test("when no budget is configured, tracker stays undefined", () => {
    const { internalContext } = createProcessContext({
      runId: "run-strike-3",
      runDir: "/tmp/run-strike-3",
      processId: "proc",
      effectIndex: effectIndexStub(),
      replayCursor: new ReplayCursor(),
    });
    expect(internalContext.forwardFixStrikeBudget).toBeUndefined();
    expect(internalContext.strikeTracker).toBeUndefined();
  });
});
