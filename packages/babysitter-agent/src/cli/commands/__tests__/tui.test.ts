import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { createBabysitterAgentCli } from "../../main";
import { createRunDir, appendEvent } from "../../../../../sdk/src/storage";
import { nextUlid } from "../../../../../sdk/src/storage/ulids";

describe("GAP-UX-001 TUI Command", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `tui-cmd-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  async function createTestRun(state: "completed" | "waiting" | "failed" = "waiting") {
    const runId = nextUlid();
    const result = await createRunDir({
      runsRoot: testDir,
      runId,
      request: "test-request",
      processId: "test-process",
    });

    await appendEvent({
      runDir: result.runDir,
      eventType: "RUN_CREATED",
      event: { processId: "test-process", entrypoint: "test.js#process" },
    });

    if (state === "completed") {
      await appendEvent({
        runDir: result.runDir,
        eventType: "RUN_COMPLETED",
        event: { result: { status: "ok" } },
      });
    } else if (state === "failed") {
      await appendEvent({
        runDir: result.runDir,
        eventType: "RUN_FAILED",
        event: { error: "test error" },
      });
    } else {
      await appendEvent({
        runDir: result.runDir,
        eventType: "EFFECT_REQUESTED",
        event: {
          effectId: `eff-${runId.slice(-4)}`,
          invocationKey: `test:S000001:task-1`,
          invocationHash: "abc123",
          stepId: "S000001",
          taskId: "task-1",
          kind: "agent",
          label: "work",
          taskDefRef: `tasks/eff-${runId.slice(-4)}/task.json`,
          labels: ["work"],
        },
      });
    }

    return { runId, runDir: result.runDir };
  }

  describe("command registration", () => {
    it("tui command is recognized and does not return unknown-command error", async () => {
      const cli = createBabysitterAgentCli();
      const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const consoleErrSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      try {
        // With --json and --runs-dir pointing to empty dir, tui should not error as "unknown command"
        const code = await cli.run(["tui", "--json", "--runs-dir", testDir]);
        const errOutput = consoleErrSpy.mock.calls.map(c => String(c[0])).join("\n");
        // Should NOT contain "Unknown command" error
        expect(errOutput).not.toContain("Unknown command");
        // Should exit cleanly (0)
        expect(code).toBe(0);
      } finally {
        stderrSpy.mockRestore();
        consoleSpy.mockRestore();
        consoleErrSpy.mockRestore();
      }
    });
  });

  describe("non-TTY JSON mode", () => {
    it("outputs JSON run listing when --json is passed", async () => {
      await createTestRun("completed");
      await createTestRun("waiting");

        const cli = createBabysitterAgentCli();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      try {
        const code = await cli.run(["tui", "--json", "--runs-dir", testDir]);
        expect(code).toBe(0);
        const output = consoleSpy.mock.calls.map(c => String(c[0])).join("\n");
        const parsed = JSON.parse(output);
        expect(parsed.runs).toBeDefined();
        expect(Array.isArray(parsed.runs)).toBe(true);
        expect(parsed.runs.length).toBe(2);
        // Each run should have runId and state
        for (const run of parsed.runs) {
          expect(run.runId).toBeDefined();
          expect(run.state).toBeDefined();
        }
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it("outputs empty runs array when no runs exist", async () => {
        const cli = createBabysitterAgentCli();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      try {
        const code = await cli.run(["tui", "--json", "--runs-dir", testDir]);
        expect(code).toBe(0);
        const output = consoleSpy.mock.calls.map(c => String(c[0])).join("\n");
        const parsed = JSON.parse(output);
        expect(parsed.runs).toEqual([]);
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it("includes run metadata in JSON output", async () => {
      const { runId } = await createTestRun("completed");
        const cli = createBabysitterAgentCli();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      try {
        await cli.run(["tui", "--json", "--runs-dir", testDir]);
        const output = consoleSpy.mock.calls.map(c => String(c[0])).join("\n");
        const parsed = JSON.parse(output);
        const run = parsed.runs.find((r: { runId: string }) => r.runId === runId);
        expect(run).toBeDefined();
        expect(run.state).toBe("completed");
        expect(run.processId).toBe("test-process");
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe("run detail view", () => {
    it("shows run detail in JSON mode with --run-id", async () => {
      const { runId } = await createTestRun("waiting");
        const cli = createBabysitterAgentCli();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      try {
        const code = await cli.run(["tui", "--json", "--runs-dir", testDir, runId]);
        expect(code).toBe(0);
        const output = consoleSpy.mock.calls.map(c => String(c[0])).join("\n");
        const parsed = JSON.parse(output);
        expect(parsed.runId).toBe(runId);
        expect(parsed.state).toBeDefined();
        expect(parsed.events).toBeDefined();
        expect(Array.isArray(parsed.events)).toBe(true);
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe("handler module", () => {
    it("exports handleTui function", async () => {
      const mod = await import("../tui");
      expect(typeof mod.handleTui).toBe("function");
    });
  });

  describe("run listing with varied states", () => {
    it("reports correct states for completed, waiting, and failed runs", async () => {
      await createTestRun("completed");
      await createTestRun("waiting");
      await createTestRun("failed");

        const cli = createBabysitterAgentCli();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      try {
        await cli.run(["tui", "--json", "--runs-dir", testDir]);
        const output = consoleSpy.mock.calls.map(c => String(c[0])).join("\n");
        const parsed = JSON.parse(output);
        const states = parsed.runs.map((r: { state: string }) => r.state).sort();
        expect(states).toEqual(["completed", "failed", "waiting"]);
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe("run detail effects", () => {
    it("includes effect tree nodes in detail view", async () => {
      const { runId } = await createTestRun("waiting");
        const cli = createBabysitterAgentCli();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      try {
        await cli.run(["tui", "--json", "--runs-dir", testDir, runId]);
        const output = consoleSpy.mock.calls.map(c => String(c[0])).join("\n");
        const parsed = JSON.parse(output);
        expect(parsed.effects).toBeDefined();
        expect(parsed.effects.length).toBeGreaterThan(0);
        expect(parsed.effects[0].kind).toBe("agent");
        expect(parsed.effects[0].status).toBe("pending");
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });
});
