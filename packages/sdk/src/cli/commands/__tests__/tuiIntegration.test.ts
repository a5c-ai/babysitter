import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { createRunDir, appendEvent } from "../../../storage";
import { nextUlid } from "../../../storage/ulids";
import { createBabysitterCli } from "../../main";

/**
 * Integration tests for CLI tree/rich output flags.
 */

describe("GAP-UX-001 Integration: CLI tree/rich flags", () => {
  let testDir: string;
  let runDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `tui-integration-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  async function setupTestRun() {
    const runId = nextUlid();
    const result = await createRunDir({
      runsRoot: testDir,
      runId,
      request: "test-request",
      processId: "test-process",
    });
    runDir = result.runDir;

    await appendEvent({
      runDir,
      eventType: "RUN_CREATED",
      event: { processId: "test-process", entrypoint: "test.js#process" },
    });

    await appendEvent({
      runDir,
      eventType: "EFFECT_REQUESTED",
      event: {
        effectId: "eff-001",
        invocationKey: "test:S000001:task-1",
        invocationHash: "abc123def456",
        stepId: "S000001",
        taskId: "task-1",
        kind: "shell",
        label: "build",
        taskDefRef: "tasks/eff-001/task.json",
        labels: ["build"],
      },
    });

    return result;
  }

  describe("run:status --tree", () => {
    it("renders tree output with effect info", async () => {
      await setupTestRun();
      const cli = createBabysitterCli();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      try {
        await cli.run(["run:status", runDir, "--tree"]);
        const output = consoleSpy.mock.calls.map(c => String(c[0])).join("\n");
        expect(output).toContain("[run:status]");
        expect(output).toContain("task-1");
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it("falls back to JSON when --json is also passed", async () => {
      await setupTestRun();
      const cli = createBabysitterCli();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      try {
        await cli.run(["run:status", runDir, "--tree", "--json"]);
        const output = consoleSpy.mock.calls.map(c => String(c[0])).join("\n");
        // JSON mode should win over tree mode
        expect(() => JSON.parse(output)).not.toThrow();
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe("run:events --rich", () => {
    it("renders rich event messages", async () => {
      await setupTestRun();
      const cli = createBabysitterCli();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      try {
        await cli.run(["run:events", runDir, "--rich"]);
        const output = consoleSpy.mock.calls.map(c => String(c[0])).join("\n");
        expect(output).toContain("[run:events]");
        expect(output.length).toBeGreaterThan(20);
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it("falls back to JSON when --json is also passed", async () => {
      await setupTestRun();
      const cli = createBabysitterCli();
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      try {
        await cli.run(["run:events", runDir, "--rich", "--json"]);
        const output = consoleSpy.mock.calls.map(c => String(c[0])).join("\n");
        expect(() => JSON.parse(output)).not.toThrow();
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });
});
