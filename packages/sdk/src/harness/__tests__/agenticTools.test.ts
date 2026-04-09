/**
 * TDD RED-phase tests for Bash Background Execution (GAP-TOOLS-036).
 *
 * Tests the background execution capability being added to the bash agentic tool:
 *   - run_in_background: optional boolean parameter on bash tool
 *   - description: optional string parameter on bash tool
 *   - BackgroundProcessRegistry: process lifecycle management
 *   - background_status / background_list helper tools
 *   - Completion callbacks and cleanup
 *
 * These tests WILL FAIL because the implementation does not exist yet.
 * That is correct — this is the TDD red phase.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createAgenticToolDefinitions,
  type CustomToolDefinition,
  type AgenticToolOptions,
  AGENTIC_TOOL_NAMES,
} from "../agenticTools";
import {
  BackgroundProcessRegistry,
} from "../backgroundProcessRegistry";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_WORKSPACE = "/tmp/test-workspace-bg";

function createTools(overrides?: Partial<AgenticToolOptions>): CustomToolDefinition[] {
  return createAgenticToolDefinitions({
    workspace: TEST_WORKSPACE,
    interactive: false,
    ...overrides,
  });
}

function findTool(name: string, overrides?: Partial<AgenticToolOptions>): CustomToolDefinition {
  const tools = createTools(overrides);
  const tool = tools.find((t) => t.name === name);
  if (!tool) throw new Error(`${name} tool not found in agentic tool definitions`);
  return tool;
}

function getResultText(result: {
  content: Array<{ type: string; text: string }>;
}): string {
  return result.content[0]?.text ?? "";
}

function parseResultJson(result: {
  content: Array<{ type: string; text: string }>;
}): unknown {
  return JSON.parse(getResultText(result));
}

async function exec(
  tool: CustomToolDefinition,
  params: Record<string, unknown>,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  return (await tool.execute("test-call", params)) as {
    content: Array<{ type: string; text: string }>;
  };
}

// ---------------------------------------------------------------------------
// 1. Bash tool parameter schema tests
// ---------------------------------------------------------------------------

describe("GAP-TOOLS-036: Bash tool parameter schema", () => {
  it("bash tool schema includes run_in_background optional boolean parameter", () => {
    const bash = findTool("bash");
    const props = bash.parameters.properties;
    expect(props).toHaveProperty("run_in_background");
    // @ts-expect-error -- property may not exist yet
    expect(props.run_in_background.type).toBe("boolean");
  });

  it("bash tool schema includes description optional string parameter", () => {
    const bash = findTool("bash");
    const props = bash.parameters.properties;
    expect(props).toHaveProperty("description");
    // @ts-expect-error -- property may not exist yet
    expect(props.description.type).toBe("string");
  });

  it("synchronous execution unchanged when run_in_background is false", async () => {
    const bash = findTool("bash");
    const result = await exec(bash, {
      command: "echo hello",
      run_in_background: false,
    });
    const parsed = parseResultJson(result) as { output: string; exitCode: number };
    expect(parsed.exitCode).toBe(0);
    expect(parsed.output).toContain("hello");
    // Should NOT have a backgroundTaskId
    expect(parsed).not.toHaveProperty("backgroundTaskId");
  });

  it("synchronous execution unchanged when run_in_background is omitted", async () => {
    const bash = findTool("bash");
    const result = await exec(bash, {
      command: "echo hello",
    });
    const parsed = parseResultJson(result) as { output: string; exitCode: number };
    expect(parsed.exitCode).toBe(0);
    expect(parsed.output).toContain("hello");
    expect(parsed).not.toHaveProperty("backgroundTaskId");
  });
});

// ---------------------------------------------------------------------------
// 2. Background execution tests
// ---------------------------------------------------------------------------

describe("GAP-TOOLS-036: Background execution", () => {
  it("when run_in_background=true, returns immediately with backgroundTaskId", async () => {
    const bash = findTool("bash");
    const result = await exec(bash, {
      command: "sleep 10",
      run_in_background: true,
    });
    const parsed = parseResultJson(result) as {
      backgroundTaskId: string;
      status: string;
    };
    expect(parsed).toHaveProperty("backgroundTaskId");
    expect(typeof parsed.backgroundTaskId).toBe("string");
    expect(parsed.backgroundTaskId.length).toBeGreaterThan(0);
  });

  it("backgroundTaskId is a unique string across calls", async () => {
    const bash = findTool("bash");
    const result1 = await exec(bash, {
      command: "sleep 10",
      run_in_background: true,
    });
    const result2 = await exec(bash, {
      command: "sleep 10",
      run_in_background: true,
    });
    const parsed1 = parseResultJson(result1) as { backgroundTaskId: string };
    const parsed2 = parseResultJson(result2) as { backgroundTaskId: string };
    expect(parsed1.backgroundTaskId).not.toBe(parsed2.backgroundTaskId);
  });

  it("background process status is 'running' immediately after launch", async () => {
    const bash = findTool("bash");
    const result = await exec(bash, {
      command: "sleep 10",
      run_in_background: true,
    });
    const parsed = parseResultJson(result) as { backgroundTaskId: string; status: string };
    expect(parsed.status).toBe("running");
  });

  it("description is included in the background task record when provided", async () => {
    const bash = findTool("bash");
    const result = await exec(bash, {
      command: "npm test",
      run_in_background: true,
      description: "Running unit tests",
    });
    const parsed = parseResultJson(result) as {
      backgroundTaskId: string;
      description: string;
    };
    expect(parsed.description).toBe("Running unit tests");
  });
});

// ---------------------------------------------------------------------------
// 3. BackgroundProcessRegistry tests
// ---------------------------------------------------------------------------

describe("GAP-TOOLS-036: BackgroundProcessRegistry", () => {
  let registry: BackgroundProcessRegistry;

  beforeEach(() => {
    registry = new BackgroundProcessRegistry();
  });

  afterEach(() => {
    registry.dispose();
  });

  it("BackgroundProcessRegistry class can be constructed", () => {
    expect(registry).toBeInstanceOf(BackgroundProcessRegistry);
  });

  it("spawn() tracks a process with backgroundTaskId, pid, command, status", () => {
    const record = registry.spawn({
      command: "echo hello",
      cwd: TEST_WORKSPACE,
    });
    expect(record).toHaveProperty("backgroundTaskId");
    expect(typeof record.backgroundTaskId).toBe("string");
    expect(record).toHaveProperty("pid");
    expect(typeof record.pid).toBe("number");
    expect(record.command).toBe("echo hello");
    expect(record.status).toBe("running");
  });

  it("get() returns record by backgroundTaskId", () => {
    const spawned = registry.spawn({
      command: "echo hello",
      cwd: TEST_WORKSPACE,
    });
    const record = registry.get(spawned.backgroundTaskId);
    expect(record).toBeDefined();
    expect(record!.backgroundTaskId).toBe(spawned.backgroundTaskId);
    expect(record!.command).toBe("echo hello");
  });

  it("get() returns undefined for unknown backgroundTaskId", () => {
    const record = registry.get("nonexistent-id");
    expect(record).toBeUndefined();
  });

  it("list() returns all tracked processes", () => {
    registry.spawn({ command: "echo a", cwd: TEST_WORKSPACE });
    registry.spawn({ command: "echo b", cwd: TEST_WORKSPACE });
    registry.spawn({ command: "echo c", cwd: TEST_WORKSPACE });

    const all = registry.list();
    expect(all).toHaveLength(3);
    expect(all.map((r) => r.command)).toEqual(
      expect.arrayContaining(["echo a", "echo b", "echo c"]),
    );
  });

  it("cancel() sends SIGTERM to the process", () => {
    const spawned = registry.spawn({
      command: "sleep 60",
      cwd: TEST_WORKSPACE,
    });
    const cancelled = registry.cancel(spawned.backgroundTaskId);
    expect(cancelled).toBe(true);
    const record = registry.get(spawned.backgroundTaskId);
    expect(record!.status).toBe("cancelled");
  });

  it("cancel() returns false for unknown backgroundTaskId", () => {
    const cancelled = registry.cancel("nonexistent-id");
    expect(cancelled).toBe(false);
  });

  it("killAll() kills all running processes", () => {
    registry.spawn({ command: "sleep 60", cwd: TEST_WORKSPACE });
    registry.spawn({ command: "sleep 60", cwd: TEST_WORKSPACE });

    registry.killAll();

    const all = registry.list();
    for (const record of all) {
      expect(record.status).not.toBe("running");
    }
  });

  it("dispose() cleans up all processes", () => {
    registry.spawn({ command: "sleep 60", cwd: TEST_WORKSPACE });
    registry.spawn({ command: "sleep 60", cwd: TEST_WORKSPACE });

    registry.dispose();

    // After dispose, list should be empty or all killed
    const all = registry.list();
    expect(all.every((r) => r.status !== "running")).toBe(true);
  });

  it("max concurrent limit (default 16) is enforced", () => {
    // Spawn 16 processes — should succeed
    for (let i = 0; i < 16; i++) {
      registry.spawn({ command: `sleep ${60 + i}`, cwd: TEST_WORKSPACE });
    }
    expect(registry.list()).toHaveLength(16);

    // 17th should throw
    expect(() =>
      registry.spawn({ command: "sleep 999", cwd: TEST_WORKSPACE }),
    ).toThrow(/max.*concurrent|limit|too many/i);
  });
});

// ---------------------------------------------------------------------------
// 4. Background helper tools tests
// ---------------------------------------------------------------------------

describe("GAP-TOOLS-036: Background helper tools", () => {
  it("background_status tool exists in tool definitions", () => {
    const tools = createTools();
    const tool = tools.find((t) => t.name === "background_status");
    expect(tool).toBeDefined();
    expect(tool!.name).toBe("background_status");
  });

  it("background_status tool has backgroundTaskId parameter", () => {
    const tool = findTool("background_status");
    const props = tool.parameters.properties;
    expect(props).toHaveProperty("backgroundTaskId");
  });

  it("background_status returns task record by ID", async () => {
    // First launch a background task
    const bash = findTool("bash");
    const launchResult = await exec(bash, {
      command: "echo bg-test",
      run_in_background: true,
    });
    const { backgroundTaskId } = parseResultJson(launchResult) as {
      backgroundTaskId: string;
    };

    // Then query its status
    const statusTool = findTool("background_status");
    const statusResult = await exec(statusTool, { backgroundTaskId });
    const parsed = parseResultJson(statusResult) as {
      backgroundTaskId: string;
      command: string;
      status: string;
    };
    expect(parsed.backgroundTaskId).toBe(backgroundTaskId);
    expect(parsed.command).toBe("echo bg-test");
  });

  it("background_status returns error for unknown ID", async () => {
    const statusTool = findTool("background_status");
    const result = await exec(statusTool, { backgroundTaskId: "nonexistent" });
    const text = getResultText(result);
    expect(text).toMatch(/error|not found|unknown/i);
  });

  it("background_list tool exists in tool definitions", () => {
    const tools = createTools();
    const tool = tools.find((t) => t.name === "background_list");
    expect(tool).toBeDefined();
    expect(tool!.name).toBe("background_list");
  });

  it("background_list returns all background tasks", async () => {
    // Launch two background tasks
    const bash = findTool("bash");
    await exec(bash, { command: "echo a", run_in_background: true });
    await exec(bash, { command: "echo b", run_in_background: true });

    const listTool = findTool("background_list");
    const result = await exec(listTool, {});
    const parsed = parseResultJson(result) as {
      tasks: Array<{ backgroundTaskId: string; command: string }>;
    };
    expect(parsed.tasks).toBeInstanceOf(Array);
    expect(parsed.tasks.length).toBeGreaterThanOrEqual(2);
  });

  it("AGENTIC_TOOL_NAMES includes background_status and background_list", () => {
    expect(AGENTIC_TOOL_NAMES).toContain("background_status");
    expect(AGENTIC_TOOL_NAMES).toContain("background_list");
  });
});

// ---------------------------------------------------------------------------
// 5. Completion and cleanup tests
// ---------------------------------------------------------------------------

describe("GAP-TOOLS-036: Completion and cleanup", () => {
  let registry: BackgroundProcessRegistry;

  beforeEach(() => {
    registry = new BackgroundProcessRegistry();
  });

  afterEach(() => {
    registry.dispose();
  });

  it("onBackgroundComplete callback is fired when process exits", async () => {
    const callback = vi.fn();
    const record = registry.spawn({
      command: "echo done",
      cwd: TEST_WORKSPACE,
      onComplete: callback,
    });

    // Wait for the short-lived process to finish
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        const current = registry.get(record.backgroundTaskId);
        if (current && current.status !== "running") {
          clearInterval(check);
          resolve();
        }
      }, 50);
      // Safety timeout
      setTimeout(() => {
        clearInterval(check);
        resolve();
      }, 5000);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        backgroundTaskId: record.backgroundTaskId,
        status: expect.stringMatching(/completed|exited/),
      }),
    );
  });

  it("stdout/stderr collected from background process", async () => {
    const record = registry.spawn({
      command: "echo hello-bg-stdout",
      cwd: TEST_WORKSPACE,
    });

    // Wait for completion
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        const current = registry.get(record.backgroundTaskId);
        if (current && current.status !== "running") {
          clearInterval(check);
          resolve();
        }
      }, 50);
      setTimeout(() => {
        clearInterval(check);
        resolve();
      }, 5000);
    });

    const completed = registry.get(record.backgroundTaskId);
    expect(completed).toBeDefined();
    expect(completed!.stdout).toContain("hello-bg-stdout");
  });

  it("session dispose kills running background processes", () => {
    registry.spawn({ command: "sleep 60", cwd: TEST_WORKSPACE });
    registry.spawn({ command: "sleep 60", cwd: TEST_WORKSPACE });

    const runningBefore = registry.list().filter((r) => r.status === "running");
    expect(runningBefore.length).toBe(2);

    registry.dispose();

    const runningAfter = registry.list().filter((r) => r.status === "running");
    expect(runningAfter.length).toBe(0);
  });
});
