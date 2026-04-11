/**
 * GAP-SESSION-002: session:history CLI command tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { handleSessionHistory } from "../sessionHistory";
import { addDecision, addRunSummary, saveContextSnapshot, getSessionHistoryPath } from "../../../session/history";

describe("GAP-SESSION-002: session:history CLI command", () => {
  let testDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `session-history-cli-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    await fs.mkdir(testDir, { recursive: true });
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  it("exits 0 and outputs empty sections for nonexistent session (AC-15)", async () => {
    const code = await handleSessionHistory({
      sessionId: "nonexistent",
      stateDir: testDir,
    });
    expect(code).toBe(0);
    const output = logSpy.mock.calls.map(c => c[0]).join("\n");
    expect(output).toContain("(none)");
  });

  it("outputs JSON with --json flag (AC-8)", async () => {
    await addDecision(testDir, "sess-json", { description: "Test decision" });
    const code = await handleSessionHistory({
      sessionId: "sess-json",
      stateDir: testDir,
      json: true,
    });
    expect(code).toBe(0);
    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.decisions).toHaveLength(1);
    expect(parsed.decisions[0].description).toBe("Test decision");
    expect(Array.isArray(parsed.runSummaries)).toBe(true);
    expect(Array.isArray(parsed.contextSnapshots)).toBe(true);
  });

  it("shows all three sections in text mode (AC-7)", async () => {
    await addDecision(testDir, "sess-text", { description: "Use TDD" });
    await addRunSummary(testDir, "sess-text", {
      runId: "run-1",
      processId: "proc-1",
      status: "completed",
      startedAt: "2026-01-01T00:00:00Z",
    });
    await saveContextSnapshot(testDir, "sess-text", {
      snapshot: { phase: "done" },
    });

    const code = await handleSessionHistory({
      sessionId: "sess-text",
      stateDir: testDir,
    });
    expect(code).toBe(0);
    const output = logSpy.mock.calls.map(c => c[0]).join("\n");
    expect(output).toContain("Decisions");
    expect(output).toContain("Use TDD");
    expect(output).toContain("Run Summaries");
    expect(output).toContain("run-1");
    expect(output).toContain("Context Snapshots");
  });

  it("filters by --run-id (AC-9)", async () => {
    await addDecision(testDir, "sess-filter", { description: "Dec A", runId: "run-1" });
    await addDecision(testDir, "sess-filter", { description: "Dec B", runId: "run-2" });
    await addRunSummary(testDir, "sess-filter", {
      runId: "run-1", processId: "p", status: "completed", startedAt: "2026-01-01T00:00:00Z",
    });
    await addRunSummary(testDir, "sess-filter", {
      runId: "run-2", processId: "p", status: "failed", startedAt: "2026-01-02T00:00:00Z",
    });

    const code = await handleSessionHistory({
      sessionId: "sess-filter",
      stateDir: testDir,
      json: true,
      runId: "run-1",
    });
    expect(code).toBe(0);
    const parsed = JSON.parse(logSpy.mock.calls[0][0]);
    expect(parsed.decisions).toHaveLength(1);
    expect(parsed.decisions[0].description).toBe("Dec A");
    expect(parsed.runSummaries).toHaveLength(1);
    expect(parsed.runSummaries[0].runId).toBe("run-1");
  });

  it("returns 1 when session-id is missing", async () => {
    const code = await handleSessionHistory({
      sessionId: "",
      stateDir: testDir,
    });
    expect(code).toBe(1);
  });

  it("returns 1 when state-dir is missing", async () => {
    const code = await handleSessionHistory({
      sessionId: "test-session",
      stateDir: "",
    });
    expect(code).toBe(1);
  });
});
