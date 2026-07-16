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
 * breakpoint effect.
 */
async function createRunFixture(effectId: string = EFFECT_ID): Promise<string> {
  const runDir = await fs.mkdtemp(path.join(os.tmpdir(), "observer-approve-bp-"));
  tempRunDirs.push(runDir);

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
      taskId: "__sdk.breakpoint",
      kind: "breakpoint",
      taskDefRef: `tasks/${effectId}/task.json`,
    },
  });
  await writeTaskDefinition(runDir, effectId, {
    effectId,
    taskId: "__sdk.breakpoint",
    invocationKey: INVOCATION_KEY,
    kind: "breakpoint",
    title: "test breakpoint",
    metadata: { breakpointId: "test.breakpoint" },
  });

  return runDir;
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

  it("surfaces the SDK rejection when the effect was never requested", async () => {
    const runDir = await fs.mkdtemp(path.join(os.tmpdir(), "observer-approve-bp-"));
    tempRunDirs.push(runDir);
    await appendEvent({
      runDir,
      eventType: "RUN_CREATED",
      event: { runId: path.basename(runDir) },
    });
    pointFindRunDirAt(runDir);

    const result = await approveBreakpoint("run-001", "eff-unknown", "yes");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Unknown effectId");
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

    const second = await approveBreakpoint("run-001", EFFECT_ID, "second");
    // The SDK refuses the second commit for an already-resolved effect; the
    // action surfaces that as the existing "already recorded" success flow.
    expect(second.success).toBe(true);
    expect(second.error).toBeUndefined();

    const entries = await listJournalEntries(runDir);
    const resolved = entries.filter((e) => e.type === "EFFECT_RESOLVED");
    expect(resolved).toHaveLength(1);

    // The first recorded answer stands — the SDK path never mutates a
    // resolved effect's result.
    const stored = await readResultJson(runDir);
    expect(stored.value.response).toBe("first");
  });

  // NOTE on signed/protected-breakpoint policy: this SDK version enforces
  // commit-time policy inside commitEffectResult via the effect index and the
  // runtime `task.completed` hook (run lock held; rejection happens BEFORE
  // any result/journal emission). Simulating a signed-policy denial would
  // require installing a real hooks-adapter configuration in the fixture,
  // which is out of scope at this layer; the "SDK rejection is surfaced as
  // { success: false }" contract is covered by the unknown-effect test above,
  // which exercises the same rejection path (commitEffectResult throws →
  // the action returns the SDK's message, never a silent success).
});
