import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

// Only the run lookup is mocked — everything else (SDK commit path, journal,
// result serialization) runs for real against a temp run fixture on disk.
const { mockFindRunDir } = vi.hoisted(() => ({
  mockFindRunDir: vi.fn(),
}));

vi.mock("@/lib/path-resolver", () => ({
  findRunDir: mockFindRunDir,
}));

import { appendEvent, writeTaskDefinition } from "@a5c-ai/babysitter-sdk";
import { approveBreakpoint } from "../approve-breakpoint";

const defaultSource = { path: "/projects", depth: 2, label: "test" };

const EFFECT_ID = "eff-001";
const INVOCATION_KEY = "__sdk.breakpoint.test-breakpoint";

const tempRunDirs: string[] = [];

/**
 * Create a real run fixture the way the SDK lays one out: a journal with
 * RUN_CREATED + EFFECT_REQUESTED (written through the SDK's own appendEvent,
 * so sequence numbers and checksums are canonical) and a task.json for the
 * breakpoint effect. `kind` is parameterizable so the breakpoint-only guard
 * can be exercised against a pending non-breakpoint (e.g. shell) effect.
 */
async function createRunFixture(
  effectId: string = EFFECT_ID,
  kind: string = "breakpoint",
  opts: {
    /**
     * Controls tasks/<effectId>/task.json (journal EFFECT_REQUESTED always
     * uses `kind`):
     * - "same" (default): task.json kind matches the journal kind
     * - "missing": no task.json at all (round 4 blocker fixture)
     * - "corrupt": task.json exists but is not valid JSON
     * - any other string: task.json declares THAT kind (journal mismatch)
     */
    taskJson?: string;
  } = {},
): Promise<string> {
  const runDir = await fs.mkdtemp(path.join(os.tmpdir(), "observer-approve-bp-"));
  tempRunDirs.push(runDir);

  const taskId = kind === "breakpoint" ? "__sdk.breakpoint" : `__sdk.${kind}`;
  await appendEvent({
    runDir,
    eventType: "RUN_CREATED",
    event: { runId: path.basename(runDir) },
  });
  await appendEvent({
    runDir,
    eventType: "EFFECT_REQUESTED",
    event: {
      effectId,
      invocationKey: INVOCATION_KEY,
      stepId: "step-1",
      taskId,
      kind,
      taskDefRef: `tasks/${effectId}/task.json`,
    },
  });

  const taskJsonMode = opts.taskJson ?? "same";
  if (taskJsonMode === "missing") {
    return runDir; // deliberately NO tasks/<effectId>/task.json
  }
  if (taskJsonMode === "corrupt") {
    await fs.mkdir(path.join(runDir, "tasks", effectId), { recursive: true });
    await fs.writeFile(
      path.join(runDir, "tasks", effectId, "task.json"),
      "{ this is not JSON",
      "utf-8",
    );
    return runDir;
  }
  const taskJsonKind = taskJsonMode === "same" ? kind : taskJsonMode;
  await writeTaskDefinition(runDir, effectId, {
    effectId,
    taskId,
    invocationKey: INVOCATION_KEY,
    kind: taskJsonKind,
    title: `test ${taskJsonKind}`,
    ...(taskJsonKind === "breakpoint"
      ? { metadata: { breakpointId: "test.breakpoint" } }
      : {}),
  });

  return runDir;
}

/** Assert the guard fired BEFORE the commit path: nothing was written. */
async function expectNothingWritten(runDir: string, effectId: string = EFFECT_ID) {
  await expect(
    fs.access(path.join(runDir, "tasks", effectId, "result.json")),
  ).rejects.toThrow();
  const entries = await listJournalEntries(runDir);
  expect(entries.filter((e) => e.type === "EFFECT_RESOLVED")).toHaveLength(0);
}

function pointFindRunDirAt(runDir: string) {
  mockFindRunDir.mockResolvedValue({
    runDir,
    source: defaultSource,
    projectName: "app",
    projectPath: "/projects/app",
  });
}

async function readResultJson(runDir: string, effectId: string = EFFECT_ID) {
  const raw = await fs.readFile(
    path.join(runDir, "tasks", effectId, "result.json"),
    "utf-8",
  );
  return JSON.parse(raw);
}

async function listJournalEntries(runDir: string) {
  const files = (await fs.readdir(path.join(runDir, "journal"))).sort();
  const entries = [];
  for (const f of files) {
    const raw = await fs.readFile(path.join(runDir, "journal", f), "utf-8");
    entries.push({ file: f, ...JSON.parse(raw) });
  }
  return entries;
}

describe("approveBreakpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await Promise.all(
      tempRunDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })),
    );
  });

  // -------------------------------------------------------------------------
  // Input validation
  // -------------------------------------------------------------------------

  it("returns error when runId is empty", async () => {
    const result = await approveBreakpoint("", "eff-001", "yes");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Missing or invalid runId");
  });

  it("returns error when effectId is empty", async () => {
    const result = await approveBreakpoint("run-001", "", "yes");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Missing or invalid effectId");
  });

  it("returns error when answer is empty", async () => {
    const result = await approveBreakpoint("run-001", "eff-001", "");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Answer cannot be empty");
  });

  it("returns error when answer is only whitespace", async () => {
    const result = await approveBreakpoint("run-001", "eff-001", "   ");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Answer cannot be empty");
  });

  it("returns error when runId contains path traversal characters", async () => {
    const result = await approveBreakpoint("../etc", "eff-001", "yes");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid characters");
  });

  it("returns error when effectId contains path traversal characters", async () => {
    const result = await approveBreakpoint("run-001", "../../etc", "yes");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid characters");
  });

  // -------------------------------------------------------------------------
  // Run/effect resolution
  // -------------------------------------------------------------------------

  it("returns error when run is not found", async () => {
    mockFindRunDir.mockResolvedValue(null);

    const result = await approveBreakpoint("run-999", "eff-001", "yes");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Run not found");
  });

  it("rejects (fail closed) when the effect was never requested — guard fires before the SDK", async () => {
    const runDir = await fs.mkdtemp(path.join(os.tmpdir(), "observer-approve-bp-"));
    tempRunDirs.push(runDir);
    await appendEvent({
      runDir,
      eventType: "RUN_CREATED",
      event: { runId: path.basename(runDir) },
    });
    pointFindRunDirAt(runDir);

    // Round 4: an unknown effect has no task.json, so the fail-closed
    // metadata guard rejects it before commitEffectResult is ever reached
    // (the SDK would also reject it — this is defense in depth).
    const result = await approveBreakpoint("run-001", "eff-unknown", "yes");
    expect(result.success).toBe(false);
    expect(result.error).toContain("task definition missing or unreadable");
    await expectNothingWritten(runDir, "eff-unknown");
  });

  // -------------------------------------------------------------------------
  // Breakpoint-only guard (review round 3, blocker)
  // -------------------------------------------------------------------------

  it("rejects a pending shell-kind effect: no result.json is created and no EFFECT_RESOLVED is appended", async () => {
    const runDir = await createRunFixture(EFFECT_ID, "shell");
    pointFindRunDirAt(runDir);

    const result = await approveBreakpoint("run-001", EFFECT_ID, "yes");
    expect(result.success).toBe(false);
    expect(result.error).toBe("not a breakpoint effect");

    // The guard fired BEFORE the commit path: nothing was written.
    await expect(
      fs.access(path.join(runDir, "tasks", EFFECT_ID, "result.json")),
    ).rejects.toThrow();
    const entries = await listJournalEntries(runDir);
    expect(entries.filter((e) => e.type === "EFFECT_RESOLVED")).toHaveLength(0);
  });

  it("rejects a pending agent-kind effect the same way (breakpoints only)", async () => {
    const runDir = await createRunFixture(EFFECT_ID, "agent");
    pointFindRunDirAt(runDir);

    const result = await approveBreakpoint("run-001", EFFECT_ID, "yes");
    expect(result).toEqual({ success: false, error: "not a breakpoint effect" });
  });

  // -------------------------------------------------------------------------
  // Fail-closed guard (review round 4, blocker): missing/corrupt task.json
  // and journal/task-file kind disagreement must never fall through to the
  // SDK commit path (commitEffectResult does not enforce breakpoint-kind).
  // -------------------------------------------------------------------------

  it("FAILS CLOSED on a requested shell effect with MISSING task.json: rejects, no result.json, no EFFECT_RESOLVED", async () => {
    const runDir = await createRunFixture(EFFECT_ID, "shell", { taskJson: "missing" });
    pointFindRunDirAt(runDir);

    const result = await approveBreakpoint("run-001", EFFECT_ID, "yes");
    expect(result.success).toBe(false);
    expect(result.error).toContain("task definition missing or unreadable");
    await expectNothingWritten(runDir);
  });

  it("FAILS CLOSED on a requested shell effect with CORRUPT task.json: rejects, nothing written", async () => {
    const runDir = await createRunFixture(EFFECT_ID, "shell", { taskJson: "corrupt" });
    pointFindRunDirAt(runDir);

    const result = await approveBreakpoint("run-001", EFFECT_ID, "yes");
    expect(result.success).toBe(false);
    expect(result.error).toContain("task definition missing or unreadable");
    await expectNothingWritten(runDir);
  });

  it("rejects when task.json claims breakpoint but the journal EFFECT_REQUESTED record says shell (kind mismatch): nothing written", async () => {
    // Journal (authoritative, what commitEffectResult resolves) says shell;
    // a forged/stale task.json claims breakpoint. The journal check must win.
    const runDir = await createRunFixture(EFFECT_ID, "shell", { taskJson: "breakpoint" });
    pointFindRunDirAt(runDir);

    const result = await approveBreakpoint("run-001", EFFECT_ID, "yes");
    expect(result.success).toBe(false);
    expect(result.error).toContain("journal EFFECT_REQUESTED record");
    await expectNothingWritten(runDir);
  });

  it("FAILS CLOSED on a breakpoint-kind task.json whose effect has NO EFFECT_REQUESTED journal record", async () => {
    // task.json alone must not be sufficient: without the authoritative
    // journal record the action refuses before the SDK commit.
    const runDir = await fs.mkdtemp(path.join(os.tmpdir(), "observer-approve-bp-"));
    tempRunDirs.push(runDir);
    await appendEvent({
      runDir,
      eventType: "RUN_CREATED",
      event: { runId: path.basename(runDir) },
    });
    await writeTaskDefinition(runDir, EFFECT_ID, {
      effectId: EFFECT_ID,
      taskId: "__sdk.breakpoint",
      invocationKey: INVOCATION_KEY,
      kind: "breakpoint",
      title: "test breakpoint",
      metadata: { breakpointId: "test.breakpoint" },
    });
    pointFindRunDirAt(runDir);

    const result = await approveBreakpoint("run-001", EFFECT_ID, "yes");
    expect(result.success).toBe(false);
    expect(result.error).toContain("no EFFECT_REQUESTED journal record");
    const entries = await listJournalEntries(runDir);
    expect(entries.filter((e) => e.type === "EFFECT_RESOLVED")).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Success path — SDK commit path writes the canonical artifacts
  // -------------------------------------------------------------------------

  it("commits through the SDK: result.json carries approved + canonical response", async () => {
    const runDir = await createRunFixture();
    pointFindRunDirAt(runDir);

    const result = await approveBreakpoint("run-001", EFFECT_ID, "Deploy approved");
    expect(result.success).toBe(true);

    const stored = await readResultJson(runDir);
    expect(stored.status).toBe("ok");
    // Canonical BreakpointResult field — process code reads result.response.
    expect(stored.value.response).toBe("Deploy approved");
    expect(stored.value.feedback).toBe("Deploy approved");
    // D1: the runtime reads `approved` to tell an approval from a rejection.
    expect(stored.value.approved).toBe(true);
    // UI alias preserved for existing observer surfaces.
    expect(stored.value.answer).toBe("Deploy approved");
    expect(stored.value.approvedBy).toBe("observer-dashboard");
    expect(stored.value.approvedAt).toBeDefined();
    // The SDK serializer mirrors the value under `result` as well.
    expect(stored.result).toEqual(stored.value);
    expect(stored.startedAt).toBeDefined();
    expect(stored.finishedAt).toBeDefined();
    // SDK-written result carries the SDK schema/version markers — proof this
    // went through the supported commit path, not a hand-rolled write.
    expect(stored.schemaVersion).toBeDefined();
    expect(stored.effectId).toBe(EFFECT_ID);
    expect(stored.invocationKey).toBe(INVOCATION_KEY);
  });

  it("appends exactly one canonical EFFECT_RESOLVED journal entry", async () => {
    const runDir = await createRunFixture();
    pointFindRunDirAt(runDir);

    const result = await approveBreakpoint("run-001", EFFECT_ID, "yes");
    expect(result.success).toBe(true);

    const entries = await listJournalEntries(runDir);
    const resolved = entries.filter((e) => e.type === "EFFECT_RESOLVED");
    expect(resolved).toHaveLength(1);
    expect(resolved[0].data.effectId).toBe(EFFECT_ID);
    expect(resolved[0].data.status).toBe("ok");
    expect(resolved[0].data.resultRef).toBe(`tasks/${EFFECT_ID}/result.json`);
    // Breakpoint enrichment from task.json metadata (SDK behavior).
    expect(resolved[0].data.breakpointId).toBe("test.breakpoint");
    // SDK journal format: checksum + contiguous sequence after the fixture's
    // RUN_CREATED (000001) + EFFECT_REQUESTED (000002).
    expect(typeof resolved[0].checksum).toBe("string");
    expect(resolved[0].checksum.length).toBe(64);
    expect(resolved[0].file).toMatch(/^000003\./);
  });

  it("trims whitespace from the answer", async () => {
    const runDir = await createRunFixture();
    pointFindRunDirAt(runDir);

    const result = await approveBreakpoint("run-001", EFFECT_ID, "  yes  ");
    expect(result.success).toBe(true);

    const stored = await readResultJson(runDir);
    expect(stored.value.response).toBe("yes");
    expect(stored.value.answer).toBe("yes");
  });

  // -------------------------------------------------------------------------
  // UX-R3 §14.5 — double-answer guard (AC-62)
  // -------------------------------------------------------------------------

  it("AC-62: a second submit surfaces the already-recorded flow and does NOT append a duplicate EFFECT_RESOLVED entry", async () => {
    const runDir = await createRunFixture();
    pointFindRunDirAt(runDir);

    const first = await approveBreakpoint("run-001", EFFECT_ID, "first");
    expect(first.success).toBe(true);
    expect(first.alreadyResolved).toBeUndefined();

    const second = await approveBreakpoint("run-001", EFFECT_ID, "second");
    // The SDK refuses the second commit for an already-resolved effect; the
    // action surfaces that as the first-answer-stands flow — not an error,
    // but flagged so the UI never implies a change was recorded.
    expect(second.success).toBe(true);
    expect(second.alreadyResolved).toBe(true);
    expect(second.error).toBeUndefined();

    const entries = await listJournalEntries(runDir);
    const resolved = entries.filter((e) => e.type === "EFFECT_RESOLVED");
    expect(resolved).toHaveLength(1);

    // The first recorded answer stands — the SDK path never mutates a
    // resolved effect's result.
    const stored = await readResultJson(runDir);
    expect(stored.value.response).toBe("first");
  });

  // NOTE on signed/protected-breakpoint policy: the pinned SDK's
  // commitEffectResult has no dedicated signed/protected-breakpoint gate
  // beyond the generic runtime `task.completed` hook, so this release's
  // safety case is breakpoint-kind-only enforcement in the ACTION (fail
  // closed on metadata + journal record, covered above). Simulating a
  // hook-policy denial would require installing a real hooks-adapter
  // configuration in the fixture, which is out of scope at this layer; the
  // "SDK rejection is surfaced, never a silent success" contract is covered
  // by the AC-62 already-resolved test above (commitEffectResult throws →
  // the action returns honestly).
});
