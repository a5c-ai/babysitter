/**
 * Tests for session:iteration-message command:
 *   - countPendingByKind (tested indirectly via handleSessionIterationMessage)
 *   - handleSessionIterationMessage
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import path from "path";
import os from "os";
import { promises as fs } from "node:fs";
import { handleSessionIterationMessage } from "../session";
import { createRunDir } from "../../../storage/createRunDir";
import { appendEvent } from "../../../storage/journal";

describe("handleSessionIterationMessage", () => {
  let runsRoot: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    runsRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cli-session-iter-msg-"));
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(async () => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    await fs.rm(runsRoot, { recursive: true, force: true });
  });

  // ── Helpers ──────────────────────────────────────────────────────────

  async function createRunSkeleton(runId: string) {
    const { runDir } = await createRunDir({
      runsRoot,
      runId,
      request: "cli-test",
      processPath: "./process.js",
    });
    await appendEvent({
      runDir,
      eventType: "RUN_CREATED",
      event: { runId },
    });
    return runDir;
  }

  async function appendRequestedEffect(runDir: string, effectId: string, kind: string, label: string) {
    const refs = await writeTaskFiles(runDir, effectId, kind);
    await appendEvent({
      runDir,
      eventType: "EFFECT_REQUESTED",
      event: {
        effectId,
        invocationKey: `${effectId}:inv`,
        stepId: `step-${effectId}`,
        taskId: `${kind}-task`,
        kind,
        label,
        taskDefRef: refs.taskDefRef,
        inputsRef: refs.inputsRef,
      },
    });
  }

  async function appendResolvedEffect(runDir: string, effectId: string) {
    await appendEvent({
      runDir,
      eventType: "EFFECT_RESOLVED",
      event: {
        effectId,
        status: "ok",
        resultRef: `tasks/${effectId}/result.json`,
        stdoutRef: `tasks/${effectId}/stdout.log`,
        stderrRef: `tasks/${effectId}/stderr.log`,
      },
    });
  }

  async function writeTaskFiles(runDir: string, effectId: string, kind: string) {
    const taskDir = path.join(runDir, "tasks", effectId);
    await fs.mkdir(taskDir, { recursive: true });
    const taskDefPath = path.join(taskDir, "task.json");
    const inputsPath = path.join(taskDir, "inputs.json");
    await fs.writeFile(taskDefPath, JSON.stringify({ kind, schemaVersion: "test" }, null, 2));
    await fs.writeFile(inputsPath, JSON.stringify({ effectId }, null, 2));
    return {
      taskDefRef: `tasks/${effectId}/task.json`,
      inputsRef: `tasks/${effectId}/inputs.json`,
    };
  }

  function readLastJson(spy: ReturnType<typeof vi.spyOn>): Record<string, unknown> {
    const calls = spy.mock.calls;
    const raw = calls.length > 0 ? String(calls[calls.length - 1]?.[0] ?? "{}") : "{}";
    return JSON.parse(raw) as Record<string, unknown>;
  }

  // ── Validation ───────────────────────────────────────────────────────

  it("returns exit code 1 when --iteration is missing", async () => {
    const exitCode = await handleSessionIterationMessage({
      runsDir: runsRoot,
      json: true,
    });

    expect(exitCode).toBe(1);
    const output = readLastJson(errorSpy);
    expect(output.error).toBe("MISSING_ITERATION");
  });

  it("prints human-readable error when --iteration is missing and json=false", async () => {
    const exitCode = await handleSessionIterationMessage({
      runsDir: runsRoot,
      iteration: undefined,
      json: false,
    });

    expect(exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("--iteration is required"),
    );
  });

  // ── Default message (no run-id) ──────────────────────────────────────

  it("generates default continue orchestration message when no run-id provided", async () => {
    const exitCode = await handleSessionIterationMessage({
      iteration: 5,
      runsDir: runsRoot,
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = readLastJson(logSpy);
    expect(output.runState).toBeNull();
    expect(output.completionProof).toBeNull();
    expect(output.pendingKinds).toBeNull();
    expect(output.iteration).toBe(5);
    expect(typeof output.systemMessage).toBe("string");
    expect(output.systemMessage).toContain("iteration 5");
    expect(output.systemMessage).toContain("continue orchestration");
  });

  it("generates human-readable output when json=false and no run-id", async () => {
    const exitCode = await handleSessionIterationMessage({
      iteration: 3,
      runsDir: runsRoot,
      json: false,
    });

    expect(exitCode).toBe(0);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("iteration=3"),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("runState=none"),
    );
  });

  // ── Run completed (completionProof) ──────────────────────────────────

  it("generates Run completed message when run has completionProof", async () => {
    const runId = "run-completed-test";
    const runDir = await createRunSkeleton(runId);
    await appendEvent({
      runDir,
      eventType: "RUN_COMPLETED",
      event: { outputRef: "state/output.json" },
    });

    const exitCode = await handleSessionIterationMessage({
      runId,
      iteration: 7,
      runsDir: runsRoot,
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = readLastJson(logSpy);
    expect(output.runState).toBe("completed");
    expect(output.completionProof).toBeTruthy();
    expect(typeof output.completionProof).toBe("string");
    expect(output.iteration).toBe(7);
    expect(output.systemMessage).toContain("Run completed!");
    expect(output.systemMessage).toContain("completionProof");
  });

  // ── Waiting with pending effects ─────────────────────────────────────

  it("generates Waiting on message when run has pending effects", async () => {
    const runId = "run-waiting-test";
    const runDir = await createRunSkeleton(runId);
    await appendRequestedEffect(runDir, "ef-node-1", "node", "build");
    await appendRequestedEffect(runDir, "ef-break-1", "breakpoint", "approval");

    const exitCode = await handleSessionIterationMessage({
      runId,
      iteration: 2,
      runsDir: runsRoot,
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = readLastJson(logSpy);
    expect(output.runState).toBe("waiting");
    expect(output.pendingKinds).toContain("node");
    expect(output.pendingKinds).toContain("breakpoint");
    expect(output.iteration).toBe(2);
    expect(output.systemMessage).toContain("Waiting on:");
    expect(output.systemMessage).toContain("node");
    expect(output.systemMessage).toContain("breakpoint");
  });

  it("reports only unresolved effects in pendingKinds", async () => {
    const runId = "run-partial-resolve";
    const runDir = await createRunSkeleton(runId);
    await appendRequestedEffect(runDir, "ef-done", "node", "build");
    await appendResolvedEffect(runDir, "ef-done");
    await appendRequestedEffect(runDir, "ef-pending", "breakpoint", "approval");

    const exitCode = await handleSessionIterationMessage({
      runId,
      iteration: 4,
      runsDir: runsRoot,
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = readLastJson(logSpy);
    expect(output.runState).toBe("waiting");
    expect(output.pendingKinds).toBe("breakpoint");
    expect(output.systemMessage).toContain("Waiting on: breakpoint");
  });

  // ── Failed run ───────────────────────────────────────────────────────

  it("generates Failed message when run state is failed", async () => {
    const runId = "run-failed-test";
    const runDir = await createRunSkeleton(runId);
    await appendEvent({
      runDir,
      eventType: "RUN_FAILED",
      event: { reason: "process threw an error" },
    });

    const exitCode = await handleSessionIterationMessage({
      runId,
      iteration: 3,
      runsDir: runsRoot,
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = readLastJson(logSpy);
    expect(output.runState).toBe("failed");
    expect(output.completionProof).toBeNull();
    expect(output.iteration).toBe(3);
    expect(output.systemMessage).toContain("Failed");
  });

  // ── Created state (no pending effects, no completion, no failure) ────

  it("generates continue orchestration message when run is in created state", async () => {
    const runId = "run-created-test";
    await createRunSkeleton(runId);

    const exitCode = await handleSessionIterationMessage({
      runId,
      iteration: 1,
      runsDir: runsRoot,
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = readLastJson(logSpy);
    expect(output.runState).toBe("created");
    expect(output.completionProof).toBeNull();
    expect(output.pendingKinds).toBeNull();
    expect(output.iteration).toBe(1);
    expect(output.systemMessage).toContain("continue orchestration");
  });

  // ── JSON output structure ────────────────────────────────────────────

  it("JSON output includes all expected fields", async () => {
    const exitCode = await handleSessionIterationMessage({
      iteration: 10,
      runsDir: runsRoot,
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = readLastJson(logSpy);
    expect(output).toHaveProperty("systemMessage");
    expect(output).toHaveProperty("runState");
    expect(output).toHaveProperty("completionProof");
    expect(output).toHaveProperty("pendingKinds");
    expect(output).toHaveProperty("skillContext");
    expect(output).toHaveProperty("iteration");
    expect(output.skillContext).toBeNull();
    expect(output.iteration).toBe(10);
  });

  // ── Non-existent run-id ──────────────────────────────────────────────

  it("handles non-existent run-id gracefully with null runState", async () => {
    const exitCode = await handleSessionIterationMessage({
      runId: "non-existent-run-xyz",
      iteration: 1,
      runsDir: runsRoot,
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = readLastJson(logSpy);
    // When the run cannot be read, runState falls back to null
    expect(output.runState).toBeNull();
    expect(output.completionProof).toBeNull();
    expect(output.pendingKinds).toBeNull();
    // Falls back to the default "continue orchestration" message
    expect(output.systemMessage).toContain("continue orchestration");
  });

  // ── countPendingByKind (tested indirectly) ───────────────────────────

  it("correctly aggregates multiple pending effects of same kind", async () => {
    const runId = "run-multi-same-kind";
    const runDir = await createRunSkeleton(runId);
    await appendRequestedEffect(runDir, "ef-node-1", "node", "build-a");
    await appendRequestedEffect(runDir, "ef-node-2", "node", "build-b");
    await appendRequestedEffect(runDir, "ef-node-3", "node", "build-c");

    const exitCode = await handleSessionIterationMessage({
      runId,
      iteration: 2,
      runsDir: runsRoot,
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = readLastJson(logSpy);
    expect(output.runState).toBe("waiting");
    // All three are "node" kind, so pendingKinds should just be "node"
    expect(output.pendingKinds).toBe("node");
    expect(output.systemMessage).toContain("Waiting on: node");
  });

  it("lists multiple different pending kinds sorted alphabetically", async () => {
    const runId = "run-multi-kind";
    const runDir = await createRunSkeleton(runId);
    await appendRequestedEffect(runDir, "ef-sleep-1", "sleep", "wait");
    await appendRequestedEffect(runDir, "ef-break-1", "breakpoint", "approval");
    await appendRequestedEffect(runDir, "ef-node-1", "node", "build");

    const exitCode = await handleSessionIterationMessage({
      runId,
      iteration: 2,
      runsDir: runsRoot,
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = readLastJson(logSpy);
    expect(output.runState).toBe("waiting");
    // Kinds are sorted alphabetically by countPendingByKind
    expect(output.pendingKinds).toBe("breakpoint, node, sleep");
  });

  it("returns empty pendingKinds when all effects are resolved", async () => {
    const runId = "run-all-resolved";
    const runDir = await createRunSkeleton(runId);
    await appendRequestedEffect(runDir, "ef-node-1", "node", "build");
    await appendResolvedEffect(runDir, "ef-node-1");

    const exitCode = await handleSessionIterationMessage({
      runId,
      iteration: 2,
      runsDir: runsRoot,
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = readLastJson(logSpy);
    // No pending effects, but not completed or failed → "created" state
    expect(output.runState).toBe("created");
    expect(output.pendingKinds).toBeNull();
    expect(output.systemMessage).toContain("continue orchestration");
  });
});
