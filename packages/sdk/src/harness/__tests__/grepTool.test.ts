/**
 * TDD RED-phase tests for new grep tool parameters.
 *
 * Tests 5 new parameters being added to the grep agentic tool:
 *   1. output_mode: 'content' | 'files_with_matches' | 'count'
 *   2. before_context: number (rg -B N)
 *   3. after_context: number (rg -A N)
 *   4. line_numbers: boolean (rg -n / --no-line-number)
 *   5. head_limit: number (post-processing output cap)
 *
 * These tests are expected to FAIL against the current implementation
 * since the features do not exist yet.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as childProcess from "node:child_process";
import {
  createAgenticToolDefinitions,
  type CustomToolDefinition,
} from "../agenticTools";

// ---------------------------------------------------------------------------
// Mock child_process.spawn so we can capture rg invocations
// ---------------------------------------------------------------------------

interface MockProc {
  stdout: { on: ReturnType<typeof vi.fn> };
  stderr: { on: ReturnType<typeof vi.fn> };
  on: ReturnType<typeof vi.fn>;
}

let lastSpawnArgs: { command: string; args: string[] } | undefined;
let mockStdout = "";
let mockStderr = "";
let mockExitCode = 0;

vi.mock("node:child_process", async (importOriginal) => {
  const actual = (await importOriginal()) as typeof childProcess;
  return {
    ...actual,
    spawn: vi.fn((...spawnArgs: unknown[]) => {
      const command = spawnArgs[0] as string;
      const args = spawnArgs[1] as string[];
      lastSpawnArgs = { command, args };

      const stdoutListeners: Record<string, (chunk: Buffer) => void> = {};
      const stderrListeners: Record<string, (chunk: Buffer) => void> = {};
      const procListeners: Record<string, (code: number | null) => void> = {};

      const proc: MockProc = {
        stdout: {
          on: vi.fn((event: string, cb: (chunk: Buffer) => void) => {
            stdoutListeners[event] = cb;
          }),
        },
        stderr: {
          on: vi.fn((event: string, cb: (chunk: Buffer) => void) => {
            stderrListeners[event] = cb;
          }),
        },
        on: vi.fn((event: string, cb: (code: number | null) => void) => {
          procListeners[event] = cb;
        }),
      };

      // Emit data + close on next tick so the promise resolves
      process.nextTick(() => {
        if (mockStdout && stdoutListeners["data"]) {
          stdoutListeners["data"](Buffer.from(mockStdout));
        }
        if (mockStderr && stderrListeners["data"]) {
          stderrListeners["data"](Buffer.from(mockStderr));
        }
        if (procListeners["close"]) {
          procListeners["close"](mockExitCode);
        }
      });

      return proc;
    }),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_WORKSPACE = "/tmp/test-workspace";

function getGrepTool(): CustomToolDefinition {
  const tools = createAgenticToolDefinitions({
    workspace: TEST_WORKSPACE,
    interactive: false,
  });
  const grep = tools.find((t) => t.name === "grep");
  if (!grep) throw new Error("grep tool not found in agentic tool definitions");
  return grep;
}

async function executeGrep(
  params: Record<string, unknown>,
): Promise<{ result: { content: Array<{ type: string; text: string }> }; spawnArgs: string[] }> {
  const grep = getGrepTool();
  const result = await grep.execute("test-call-id", params);
  const spawnArgs = lastSpawnArgs?.args ?? [];
  return { result, spawnArgs };
}

function getResultText(result: { content: Array<{ type: string; text: string }> }): string {
  return result.content[0]?.text ?? "";
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  lastSpawnArgs = undefined;
  mockStdout = "file1.ts:10:const foo = 1;\nfile2.ts:20:const bar = 2;\n";
  mockStderr = "";
  mockExitCode = 0;
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("grep tool — output_mode parameter", () => {
  it("should default output_mode to 'files_with_matches' and use rg -l", async () => {
    mockStdout = "file1.ts\nfile2.ts\n";
    const { spawnArgs } = await executeGrep({ pattern: "foo" });

    // Default mode should produce -l flag (files only)
    expect(spawnArgs).toContain("-l");
    // Should NOT include --no-heading or --line-number in files mode
    expect(spawnArgs).not.toContain("--no-heading");
    expect(spawnArgs).not.toContain("--line-number");
  });

  it("should use rg -l when output_mode='files_with_matches'", async () => {
    mockStdout = "file1.ts\nfile2.ts\n";
    const { spawnArgs } = await executeGrep({
      pattern: "foo",
      output_mode: "files_with_matches",
    });

    expect(spawnArgs).toContain("-l");
    expect(spawnArgs).not.toContain("--no-heading");
    expect(spawnArgs).not.toContain("--line-number");
  });

  it("should use rg -c when output_mode='count'", async () => {
    mockStdout = "file1.ts:3\nfile2.ts:1\n";
    const { spawnArgs } = await executeGrep({
      pattern: "foo",
      output_mode: "count",
    });

    expect(spawnArgs).toContain("-c");
    expect(spawnArgs).not.toContain("--no-heading");
    expect(spawnArgs).not.toContain("--line-number");
    expect(spawnArgs).not.toContain("-l");
  });

  it("should use --no-heading and --line-number when output_mode='content'", async () => {
    const { spawnArgs } = await executeGrep({
      pattern: "foo",
      output_mode: "content",
    });

    expect(spawnArgs).toContain("--no-heading");
    expect(spawnArgs).toContain("--line-number");
    expect(spawnArgs).not.toContain("-l");
    expect(spawnArgs).not.toContain("-c");
  });
});

describe("grep tool — before_context/after_context parameters", () => {
  it("should add -B flag when before_context=3 in content mode", async () => {
    const { spawnArgs } = await executeGrep({
      pattern: "foo",
      output_mode: "content",
      before_context: 3,
    });

    expect(spawnArgs).toContain("-B");
    const bIndex = spawnArgs.indexOf("-B");
    expect(spawnArgs[bIndex + 1]).toBe("3");
  });

  it("should add -A flag when after_context=5 in content mode", async () => {
    const { spawnArgs } = await executeGrep({
      pattern: "foo",
      output_mode: "content",
      after_context: 5,
    });

    expect(spawnArgs).toContain("-A");
    const aIndex = spawnArgs.indexOf("-A");
    expect(spawnArgs[aIndex + 1]).toBe("5");
  });

  it("should support before and after used together", async () => {
    const { spawnArgs } = await executeGrep({
      pattern: "foo",
      output_mode: "content",
      before_context: 2,
      after_context: 4,
    });

    expect(spawnArgs).toContain("-B");
    expect(spawnArgs).toContain("-A");
    const bIndex = spawnArgs.indexOf("-B");
    const aIndex = spawnArgs.indexOf("-A");
    expect(spawnArgs[bIndex + 1]).toBe("2");
    expect(spawnArgs[aIndex + 1]).toBe("4");
  });

  it("should not add -C when before_context/after_context are provided", async () => {
    const { spawnArgs } = await executeGrep({
      pattern: "foo",
      output_mode: "content",
      before_context: 2,
      after_context: 4,
      context: 99,
    });

    expect(spawnArgs).toContain("-B");
    expect(spawnArgs).toContain("-A");
    expect(spawnArgs).not.toContain("-C");
  });

  it("should ignore before_context/after_context in files_with_matches mode", async () => {
    const { spawnArgs } = await executeGrep({
      pattern: "foo",
      output_mode: "files_with_matches",
      before_context: 3,
      after_context: 5,
    });

    expect(spawnArgs).not.toContain("-B");
    expect(spawnArgs).not.toContain("-A");
  });

  it("should ignore before_context/after_context in count mode", async () => {
    const { spawnArgs } = await executeGrep({
      pattern: "foo",
      output_mode: "count",
      before_context: 3,
      after_context: 5,
    });

    expect(spawnArgs).not.toContain("-B");
    expect(spawnArgs).not.toContain("-A");
  });
});

describe("grep tool — line_numbers parameter", () => {
  it("should default line_numbers to true in content mode (--line-number)", async () => {
    const { spawnArgs } = await executeGrep({
      pattern: "foo",
      output_mode: "content",
    });

    expect(spawnArgs).toContain("--line-number");
    expect(spawnArgs).not.toContain("--no-line-number");
  });

  it("should use --no-line-number when line_numbers=false in content mode", async () => {
    const { spawnArgs } = await executeGrep({
      pattern: "foo",
      output_mode: "content",
      line_numbers: false,
    });

    expect(spawnArgs).toContain("--no-line-number");
    expect(spawnArgs).not.toContain("--line-number");
  });

  it("should ignore line_numbers in files_with_matches mode", async () => {
    const { spawnArgs } = await executeGrep({
      pattern: "foo",
      output_mode: "files_with_matches",
      line_numbers: true,
    });

    // files_with_matches mode should not add any line-number flags
    expect(spawnArgs).not.toContain("--line-number");
    expect(spawnArgs).not.toContain("--no-line-number");
  });

  it("should ignore line_numbers in count mode", async () => {
    const { spawnArgs } = await executeGrep({
      pattern: "foo",
      output_mode: "count",
      line_numbers: false,
    });

    expect(spawnArgs).not.toContain("--line-number");
    expect(spawnArgs).not.toContain("--no-line-number");
  });
});

describe("grep tool — head_limit parameter", () => {
  it("should default head_limit to 250 lines", async () => {
    // Generate output with 300 lines
    const lines = Array.from({ length: 300 }, (_, i) => `file.ts:${i + 1}:line ${i + 1}`);
    mockStdout = lines.join("\n") + "\n";

    const { result } = await executeGrep({
      pattern: "line",
      output_mode: "content",
    });

    const text = getResultText(result);
    const outputLines = text.split("\n").filter((l) => l.length > 0);
    expect(outputLines.length).toBeLessThanOrEqual(250);
  });

  it("should cap output to head_limit lines when specified", async () => {
    const lines = Array.from({ length: 50 }, (_, i) => `file.ts:${i + 1}:line ${i + 1}`);
    mockStdout = lines.join("\n") + "\n";

    const { result } = await executeGrep({
      pattern: "line",
      output_mode: "content",
      head_limit: 10,
    });

    const text = getResultText(result);
    const outputLines = text.split("\n").filter((l) => l.length > 0);
    expect(outputLines.length).toBeLessThanOrEqual(10);
  });

  it("should apply head_limit before offset/limit processing", async () => {
    // 100 lines of output, head_limit=20, offset=5, limit=10
    const lines = Array.from({ length: 100 }, (_, i) => `file.ts:${i + 1}:line ${i + 1}`);
    mockStdout = lines.join("\n") + "\n";

    const { result } = await executeGrep({
      pattern: "line",
      output_mode: "content",
      head_limit: 20,
      offset: 5,
      limit: 10,
    });

    const text = getResultText(result);
    const outputLines = text.split("\n").filter((l) => l.length > 0);
    // After head_limit=20, we have 20 lines. Then offset=5, limit=10 gives at most 10 lines.
    expect(outputLines.length).toBeLessThanOrEqual(10);

    // The first output line should be the 6th line (0-indexed: 5) of the head-limited set
    if (outputLines.length > 0) {
      expect(outputLines[0]).toContain(":6:");
    }
  });

  it("should apply head_limit in files_with_matches mode", async () => {
    const files = Array.from({ length: 30 }, (_, i) => `file${i + 1}.ts`);
    mockStdout = files.join("\n") + "\n";

    const { result } = await executeGrep({
      pattern: "foo",
      output_mode: "files_with_matches",
      head_limit: 5,
    });

    const text = getResultText(result);
    const outputLines = text.split("\n").filter((l) => l.length > 0);
    expect(outputLines.length).toBeLessThanOrEqual(5);
  });

  it("should apply head_limit in count mode", async () => {
    const counts = Array.from({ length: 20 }, (_, i) => `file${i + 1}.ts:${i + 1}`);
    mockStdout = counts.join("\n") + "\n";

    const { result } = await executeGrep({
      pattern: "foo",
      output_mode: "count",
      head_limit: 3,
    });

    const text = getResultText(result);
    const outputLines = text.split("\n").filter((l) => l.length > 0);
    expect(outputLines.length).toBeLessThanOrEqual(3);
  });
});

describe("grep tool — backward compatibility", () => {
  it("should pass pattern to rg args", async () => {
    const { spawnArgs } = await executeGrep({ pattern: "myPattern" });

    // Pattern should appear after the -- separator
    const dashDashIndex = spawnArgs.indexOf("--");
    expect(dashDashIndex).toBeGreaterThan(-1);
    expect(spawnArgs[dashDashIndex + 1]).toBe("myPattern");
  });

  it("should resolve path relative to workspace", async () => {
    const { spawnArgs } = await executeGrep({
      pattern: "foo",
      path: "src/lib",
    });

    const dashDashIndex = spawnArgs.indexOf("--");
    const searchPath = spawnArgs[dashDashIndex + 2];
    expect(searchPath).toContain("src");
    expect(searchPath).toContain("lib");
  });

  it("should default search path to workspace when path not provided", async () => {
    const { spawnArgs } = await executeGrep({ pattern: "foo" });

    const dashDashIndex = spawnArgs.indexOf("--");
    const searchPath = spawnArgs[dashDashIndex + 2];
    expect(searchPath).toBe(TEST_WORKSPACE);
  });

  it("should pass glob filter via --glob", async () => {
    const { spawnArgs } = await executeGrep({
      pattern: "foo",
      glob: "*.ts",
    });

    expect(spawnArgs).toContain("--glob");
    const globIndex = spawnArgs.indexOf("--glob");
    expect(spawnArgs[globIndex + 1]).toBe("*.ts");
  });

  it("should pass type filter via --type", async () => {
    const { spawnArgs } = await executeGrep({
      pattern: "foo",
      type: "ts",
    });

    expect(spawnArgs).toContain("--type");
    const typeIndex = spawnArgs.indexOf("--type");
    expect(spawnArgs[typeIndex + 1]).toBe("ts");
  });

  it("should pass -i flag for case-insensitive search", async () => {
    const { spawnArgs } = await executeGrep({
      pattern: "foo",
      i: true,
    });

    expect(spawnArgs).toContain("-i");
  });

  it("should pass -C flag for context lines in content mode", async () => {
    const { spawnArgs } = await executeGrep({
      pattern: "foo",
      output_mode: "content",
      context: 3,
    });

    expect(spawnArgs).toContain("-C");
    const cIndex = spawnArgs.indexOf("-C");
    expect(spawnArgs[cIndex + 1]).toBe("3");
  });

  it("should ignore context param in files_with_matches mode", async () => {
    const { spawnArgs } = await executeGrep({
      pattern: "foo",
      output_mode: "files_with_matches",
      context: 3,
    });

    expect(spawnArgs).not.toContain("-C");
  });

  it("should ignore context param in count mode", async () => {
    const { spawnArgs } = await executeGrep({
      pattern: "foo",
      output_mode: "count",
      context: 3,
    });

    expect(spawnArgs).not.toContain("-C");
  });

  it("should pass -U and --multiline-dotall for multiline mode", async () => {
    const { spawnArgs } = await executeGrep({
      pattern: "foo.*bar",
      multiline: true,
    });

    expect(spawnArgs).toContain("-U");
    expect(spawnArgs).toContain("--multiline-dotall");
  });

  it("should apply offset and limit to output lines", async () => {
    const lines = Array.from({ length: 20 }, (_, i) => `file.ts:${i + 1}:line ${i + 1}`);
    mockStdout = lines.join("\n");

    const { result } = await executeGrep({
      pattern: "line",
      output_mode: "content",
      offset: 5,
      limit: 3,
    });

    const text = getResultText(result);
    const outputLines = text.split("\n").filter((l) => l.length > 0);
    expect(outputLines.length).toBeLessThanOrEqual(3);
  });

  it("should return '(no matches)' when rg produces no output", async () => {
    mockStdout = "";
    mockExitCode = 1;

    const { result } = await executeGrep({ pattern: "nonexistent" });

    const text = getResultText(result);
    expect(text).toBe("(no matches)");
  });

  it("should always pass --color never", async () => {
    const { spawnArgs } = await executeGrep({ pattern: "foo" });

    expect(spawnArgs).toContain("--color");
    const colorIndex = spawnArgs.indexOf("--color");
    expect(spawnArgs[colorIndex + 1]).toBe("never");
  });
});
