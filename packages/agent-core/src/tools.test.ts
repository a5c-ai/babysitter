import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { PassThrough } from "node:stream";
import { afterEach, describe, expect, it, vi } from "vitest";

let backgroundTaskCounter = 0;

vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}));

vi.mock("@a5c-ai/babysitter-sdk", () => ({
  nextUlid: vi.fn(() => `background-task-id-${++backgroundTaskCounter}`),
  createScopedRuntimeConfigState: vi.fn(() => ({
    get: vi.fn(() => undefined),
    set: vi.fn(),
    reset: vi.fn(),
    snapshot: vi.fn(() => ({})),
  })),
  CONFIG_ENV_VARS: {
    RUNS_DIR: "BABYSITTER_RUNS_DIR",
    MAX_ITERATIONS: "BABYSITTER_MAX_ITERATIONS",
    QUALITY_THRESHOLD: "BABYSITTER_QUALITY_THRESHOLD",
    TIMEOUT: "BABYSITTER_TIMEOUT",
    LOG_LEVEL: "BABYSITTER_LOG_LEVEL",
    ALLOW_SECRET_LOGS: "BABYSITTER_ALLOW_SECRET_LOGS",
    HOOK_TIMEOUT: "BABYSITTER_HOOK_TIMEOUT",
    NODE_TASK_TIMEOUT: "BABYSITTER_NODE_TASK_TIMEOUT",
  },
  DEFAULTS: {
    runsDir: ".a5c/runs",
    maxIterations: 5,
    qualityThreshold: 0.8,
    timeout: 60_000,
    logLevel: "info",
    allowSecretLogs: false,
    hookTimeout: 30_000,
    nodeTaskTimeout: 30_000,
    clockStepMs: 1,
    clockStartMs: 0,
    layoutVersion: "test",
    largeResultPreviewLimit: 1000,
  },
  getConfig: vi.fn(() => ({
    runsDir: ".a5c/runs",
    maxIterations: 5,
    qualityThreshold: 0.8,
    timeout: 60_000,
    logLevel: "info",
    allowSecretLogs: false,
    hookTimeout: 30_000,
    nodeTaskTimeout: 30_000,
    clockStepMs: 1,
    clockStartMs: 0,
    layoutVersion: "test",
    largeResultPreviewLimit: 1000,
  })),
}));

import * as childProcess from "node:child_process";

import {
  createAgentCoreToolDefinitions,
  disposeAgentCoreToolDefinitions,
  extractTextFromHtml,
  filterByRelevance,
  parseSearchResults,
  stripHtmlTags,
} from "./tools";
import {
  createAgentCoreToolDefinitions as createAgentCoreToolDefinitionsFromIndex,
  DeferredToolRegistry,
} from "./index";
import { BackgroundProcessRegistry } from "./backgroundProcessRegistry";
import { AGENT_CORE_TOOL_NAMES } from "./types";

function getText(result: Awaited<ReturnType<ReturnType<typeof getTool>["execute"]>>) {
  return result.content[0]?.text ?? "";
}

function getToolDefinitions(
  workspace: string,
  overrides: Partial<Parameters<typeof createAgentCoreToolDefinitions>[0]> = {},
) {
  const definitions = createAgentCoreToolDefinitions({
    workspace,
    interactive: false,
    ...overrides,
    deferredToolRegistry: new DeferredToolRegistry(),
  });
  return definitions;
}

function getTool(name: string, workspace: string, onToolUse?: (toolName: string, params: unknown) => void) {
  const definitions = getToolDefinitions(workspace, { onToolUse });
  const tool = definitions.find((definition) => definition.name === name);
  if (!tool) {
    throw new Error(`Tool ${name} not found`);
  }
  return tool;
}

function mockSpawnExit(exitCode = 0, stdoutText = "") {
  vi.mocked(childProcess.spawn).mockImplementation(() => {
    const processHandle = new PassThrough() as unknown as childProcess.ChildProcessWithoutNullStreams;
    const stdout = new PassThrough();
    const stderr = new PassThrough();
    Object.assign(processHandle, { stdout, stderr });
    setTimeout(() => {
      if (stdoutText) {
        stdout.write(stdoutText);
      }
      stdout.end();
      stderr.end();
      (processHandle as unknown as PassThrough).emit("close", exitCode);
    }, 0);
    return processHandle;
  });
}

describe("agent-core tools", () => {
  afterEach(() => {
    backgroundTaskCounter = 0;
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("wraps tool definitions and records onToolUse for file-system flows", async () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-tools-"));
    const filePath = path.join(workspace, "note.txt");
    writeFileSync(filePath, "first line\nsecond line\n", "utf8");
    const onToolUse = vi.fn();

    const readTool = getTool("read", workspace, onToolUse);
    const editTool = getTool("edit", workspace, onToolUse);

    const readResult = await readTool.execute("call-read", { path: "note.txt", offset: 2, limit: 1 });
    const editResult = await editTool.execute("call-edit", {
      path: "note.txt",
      old_string: "second line",
      new_string: "updated line",
    });
    const failedEdit = await editTool.execute("call-edit-fail", {
      path: "note.txt",
      old_string: "missing text",
      new_string: "ignored",
    });

    expect(getText(readResult)).toBe("2\tsecond line");
    expect(getText(readResult)).not.toContain("1\tfirst line");
    expect(getText(editResult)).toContain("File edited:");
    expect(getText(editResult)).toContain("--- a/note.txt");
    expect(getText(editResult)).toContain("+++ b/note.txt");
    expect(getText(editResult)).toContain("-second line");
    expect(getText(editResult)).toContain("+updated line");
    expect(readFileSync(filePath, "utf8")).toContain("updated line");
    expect(getText(failedEdit)).toBe("Error: old_string not found in note.txt. Ensure it matches exactly.");
    expect(onToolUse).toHaveBeenNthCalledWith(1, "read", { path: "note.txt", offset: 2, limit: 1 });
    expect(onToolUse).toHaveBeenNthCalledWith(2, "edit", {
      path: "note.txt",
      old_string: "second line",
      new_string: "updated line",
    });
  });

  it("executes the bash wrapper and returns combined output with exit code", async () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-bash-"));
    vi.mocked(childProcess.spawn).mockImplementation(() => {
      const processHandle = new PassThrough() as unknown as childProcess.ChildProcessWithoutNullStreams;
      const stdout = new PassThrough();
      const stderr = new PassThrough();
      Object.assign(processHandle, { stdout, stderr });
      setTimeout(() => {
        stdout.write("stdout text");
        stderr.write("stderr text");
        stdout.end();
        stderr.end();
        (processHandle as unknown as PassThrough).emit("close", 7);
      }, 0);
      return processHandle;
    });

    const bashTool = getTool("bash", workspace);
    const result = await bashTool.execute("call-bash", { command: "echo test" });
    const parsed = JSON.parse(getText(result)) as { output: string; exitCode: number };

    expect(childProcess.spawn).toHaveBeenCalledOnce();
    const [command, args] = vi.mocked(childProcess.spawn).mock.calls[0]!;
    expect({ command, args }).toEqual({
      command: process.platform === "win32" ? "cmd.exe" : "/bin/bash",
      args: process.platform === "win32" ? ["/c", "echo test"] : ["-c", "echo test"],
    });
    expect(parsed).toEqual({
      output: "stdout text\nstderr text",
      exitCode: 7,
    });
  });

  it("propagates shared AbortSignal and streams bash output updates", async () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-bash-signal-"));
    const controller = new AbortController();
    vi.mocked(childProcess.spawn).mockImplementation(() => {
      const processHandle = new PassThrough() as unknown as childProcess.ChildProcessWithoutNullStreams;
      const stdout = new PassThrough();
      const stderr = new PassThrough();
      Object.assign(processHandle, { stdout, stderr });
      setTimeout(() => {
        stdout.write("streamed stdout");
        stdout.end();
        stderr.end();
        (processHandle as unknown as PassThrough).emit("close", 0);
      }, 0);
      return processHandle;
    });

    const onUpdate = vi.fn();
    const bashTool = getTool("bash", workspace);
    await bashTool.execute(
      "call-bash-stream",
      { command: "echo test" },
      onUpdate,
      { signal: controller.signal, limits: { timeoutMs: 1234, maxOutputBytes: 2048 } },
    );

    expect(childProcess.spawn).toHaveBeenCalledOnce();
    const spawnOptions = vi.mocked(childProcess.spawn).mock.calls[0][2] as childProcess.SpawnOptions;
    expect(spawnOptions.signal).toBe(controller.signal);
    expect(spawnOptions.timeout).toBe(1234);
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
      type: "tool.stdout",
      callId: "call-bash-stream",
      chunk: "streamed stdout",
      sequence: 1,
    }));
  });

  it("requires explicit insecure SSH host-key policy before disabling host checks", async () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-ssh-policy-"));
    mockSpawnExit();

    const sshTool = getTool("ssh", workspace);
    await sshTool.execute("call-ssh", {
      host: "host.example",
      command: "pwd",
      hostKeyPolicy: "strict",
    });

    const args = vi.mocked(childProcess.spawn).mock.calls[0][1] as string[];
    expect(args).not.toContain("StrictHostKeyChecking=no");
  });

  it("exposes code_executor only when programmatic tool calling is enabled", () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-code-mode-toggle-"));

    expect(getToolDefinitions(workspace).some((tool) => tool.name === "code_executor")).toBe(false);
    expect(getToolDefinitions(workspace, { programmaticToolCalling: true }).some((tool) => tool.name === "code_executor"))
      .toBe(true);
  });

  it("registers built-in tools in the unified tool registry and uses it for discovery", async () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-unified-registry-"));
    const tools = new Map<string, {
      name: string;
      description?: string;
      parameters?: Record<string, unknown>;
      source: "builtin" | "mcp" | "plugin" | "custom";
    }>();
    const toolRegistry = {
      registerAll: vi.fn((entries: Array<{
        name: string;
        description?: string;
        parameters?: Record<string, unknown>;
        source: "builtin" | "mcp" | "plugin" | "custom";
      }>) => {
        for (const entry of entries) tools.set(entry.name, entry);
      }),
      searchTools: vi.fn((query: string, maxResults = 20) =>
        [...tools.values()]
          .filter((tool) => tool.name.includes(query) || tool.description?.includes(query))
          .slice(0, maxResults)
          .map((tool) => ({
            name: tool.name,
            description: tool.description ?? "",
            source: tool.source,
          }))),
      fetchSchema: vi.fn(async (name: string) => {
        const tool = tools.get(name);
        return tool
          ? {
            name: tool.name,
            description: tool.description ?? "",
            source: tool.source,
            schema: { inputSchema: tool.parameters ?? {} },
          }
          : undefined;
      }),
    };
    const definitions = createAgentCoreToolDefinitions({ workspace, interactive: false, toolRegistry });
    const toolSearch = definitions.find((tool) => tool.name === "tool_search");
    const toolFetch = definitions.find((tool) => tool.name === "tool_fetch");
    if (!toolSearch || !toolFetch) {
      throw new Error("Expected discovery tools");
    }

    const searchResult = JSON.parse(getText(await toolSearch.execute("search", { query: "read" }))) as {
      tools: Array<{ name: string }>;
    };
    const fetchResult = JSON.parse(getText(await toolFetch.execute("fetch", { name: "read" }))) as {
      inputSchema: Record<string, unknown>;
    };

    expect(toolRegistry.registerAll).toHaveBeenCalledOnce();
    expect(searchResult.tools.some((tool) => tool.name === "read")).toBe(true);
    expect(fetchResult.inputSchema).toEqual(expect.objectContaining({ type: "object" }));
  });

  it("exposes native task-router tools and delegates through taskHandler", async () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-native-task-tools-"));
    const taskHandler = vi.fn(async (params) => ({ routed: true, params }));
    const definitions = getToolDefinitions(workspace, { taskHandler });

    for (const name of ["create_todo", "assign_task", "search_tasks", "escalate"]) {
      expect(definitions.some((tool) => tool.name === name)).toBe(true);
    }

    const createTodo = definitions.find((tool) => tool.name === "create_todo");
    if (!createTodo) {
      throw new Error("create_todo not found");
    }

    const result = await createTodo.execute("call-create-todo", {
      title: "Review tasks-mux routing",
      responderType: "human",
    });

    expect(taskHandler).toHaveBeenCalledWith({
      title: "Review tasks-mux routing",
      responderType: "human",
      tool: "create_todo",
      action: "create_todo",
    });
    expect(JSON.parse(getText(result))).toEqual({
      routed: true,
      params: {
        title: "Review tasks-mux routing",
        responderType: "human",
        tool: "create_todo",
        action: "create_todo",
      },
    });
  });

  it("keeps advertised bundled tool names aligned with generated definitions", () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-tool-parity-"));
    const advertised = [...AGENT_CORE_TOOL_NAMES].sort();

    expect(getToolDefinitions(workspace).map((tool) => tool.name).sort()).toEqual(
      advertised.filter((name) => name !== "code_executor"),
    );
    expect(getToolDefinitions(workspace, { programmaticToolCalling: true }).map((tool) => tool.name).sort()).toEqual(
      advertised,
    );
  });

  it("evaluates safe calc expressions", async () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-calc-"));
    const calc = getTool("calc", workspace);

    expect(getText(await Promise.resolve(calc.execute("calc-basic", { expression: "1 + 2 * 3" })))).toBe("7");
    expect(getText(await Promise.resolve(calc.execute("calc-parens", { expression: "(1 + 2) * -3" })))).toBe("-9");
    expect(getText(await Promise.resolve(calc.execute("calc-decimal", { expression: "0.5 + .25" })))).toBe("0.75");
    expect(getText(await Promise.resolve(calc.execute("calc-power", { expression: "2 ** 3 ** 2" })))).toBe("512");
  });

  it("rejects unsafe or malformed calc expressions", async () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-calc-reject-"));
    const calc = getTool("calc", workspace);

    const rejected = [
      "process.exit()",
      "Math.max(1, 2)",
      "({}).constructor",
      "a = 1",
      "1, 2",
      "1 / 0",
      "2 ** 1024",
      "(".repeat(300),
    ];

    for (const expression of rejected) {
      const result = await calc.execute(`calc-reject-${expression.length}`, { expression });
      expect(getText(result)).toMatch(/^Error: /);
    }
  });

  it("executes a programmatic tool chain against existing tools", async () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-code-mode-"));
    writeFileSync(path.join(workspace, "note.txt"), "alpha\nbeta\n", "utf8");
    const onToolUse = vi.fn();
    const definitions = getToolDefinitions(workspace, {
      onToolUse,
      programmaticToolCalling: true,
    });
    const codeExecutor = definitions.find((tool) => tool.name === "code_executor");
    if (!codeExecutor) {
      throw new Error("Expected code_executor to be registered");
    }

    const result = await codeExecutor.execute("code-mode", {
      code: [
        "const readResult = await tools.read({ path: 'note.txt' });",
        "await callTool('write', { path: 'copy.txt', content: readResult });",
        "console.log('read bytes', String(readResult).length);",
        "return { readResult, copied: await tools.read({ path: 'copy.txt' }) };",
      ].join("\n"),
    });

    const resultText = getText(result);
    if (resultText.startsWith("Error:")) {
      throw new Error(resultText);
    }
    const payload = JSON.parse(resultText) as {
      result: { readResult: string; copied: string };
      logs: string[];
      toolCalls: Array<{ tool: string }>;
    };
    expect(payload.result.readResult).toContain("alpha");
    expect(payload.result.copied).toContain("alpha");
    expect(payload.logs).toEqual(["read bytes 17"]);
    expect(payload.toolCalls.map((call) => call.tool)).toEqual(["read", "write", "read"]);
    expect(onToolUse).toHaveBeenCalledWith("code_executor", expect.objectContaining({ code: expect.any(String) }));
    expect(onToolUse).toHaveBeenCalledWith("read", { path: "note.txt" });
    expect(onToolUse).toHaveBeenCalledWith("write", {
      path: "copy.txt",
      content: expect.stringContaining("alpha"),
    });
  });

  it("routes code_executor nested tool calls through the unified dispatcher", async () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-code-mode-dispatcher-"));
    writeFileSync(path.join(workspace, "note.txt"), "alpha\n", "utf8");
    const dispatch = vi.fn(async (
      _context: unknown,
      executor: (_tool: { name: string }, context: { input: unknown }) => Promise<unknown>,
    ) => ({
      output: await executor({ name: "read" }, { input: { path: "note.txt" } }),
      durationMs: 1,
    }));
    const definitions = getToolDefinitions(workspace, {
      programmaticToolCalling: true,
      toolDispatcher: { dispatch },
    });
    const codeExecutor = definitions.find((tool) => tool.name === "code_executor");
    if (!codeExecutor) {
      throw new Error("Expected code_executor to be registered");
    }

    const result = await codeExecutor.execute("code-mode-dispatch", {
      code: "return await tools.read({ path: 'note.txt' });",
    });
    const payload = JSON.parse(getText(result)) as { result: string };

    expect(payload.result).toContain("alpha");
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ toolName: "read", caller: "code_executor" }),
      expect.any(Function),
    );
  });

  it("propagates code_executor tool context into nested tool calls", async () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-code-mode-context-"));
    const controller = new AbortController();
    vi.mocked(childProcess.spawn).mockImplementation(() => {
      const processHandle = new PassThrough() as unknown as childProcess.ChildProcessWithoutNullStreams;
      const stdout = new PassThrough();
      const stderr = new PassThrough();
      Object.assign(processHandle, { stdout, stderr });
      setTimeout(() => {
        stdout.write("nested stdout");
        stdout.end();
        stderr.end();
        (processHandle as unknown as PassThrough).emit("close", 0);
      }, 0);
      return processHandle;
    });

    const codeExecutor = getToolDefinitions(workspace, {
      programmaticToolCalling: true,
    }).find((tool) => tool.name === "code_executor");
    if (!codeExecutor) {
      throw new Error("Expected code_executor to be registered");
    }

    const onUpdate = vi.fn();
    const result = await codeExecutor.execute(
      "code-mode-context",
      { code: "return await tools.bash({ command: 'echo nested' });" },
      onUpdate,
      { signal: controller.signal, limits: { timeoutMs: 4321, maxOutputBytes: 4096 } },
    );
    const payload = JSON.parse(getText(result)) as { result: { exitCode: number } };

    const spawnOptions = vi.mocked(childProcess.spawn).mock.calls[0][2] as childProcess.SpawnOptions;
    expect(payload.result.exitCode).toBe(0);
    expect(spawnOptions.signal).toBe(controller.signal);
    expect(spawnOptions.timeout).toBe(4321);
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
      type: "tool.stdout",
      callId: "code-executor:1:bash",
      chunk: "nested stdout",
    }));
  });

  it("enforces code_executor nested tool call limits", async () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-code-mode-limit-"));
    const codeExecutor = getToolDefinitions(workspace, {
      programmaticToolCalling: { maxToolCalls: 1 },
    }).find((tool) => tool.name === "code_executor");
    if (!codeExecutor) {
      throw new Error("Expected code_executor to be registered");
    }

    const result = await codeExecutor.execute("code-mode-limit", {
      code: [
        "await tools.tool_search({ query: 'read' });",
        "await tools.tool_search({ query: 'write' });",
        "return 'unreachable';",
      ].join("\n"),
    });

    expect(getText(result)).toBe("Error: code_executor exceeded max_tool_calls (1)");
  });

  it("does not allow code_executor invocations to raise configured limits", async () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-code-mode-limit-cap-"));
    const codeExecutor = getToolDefinitions(workspace, {
      programmaticToolCalling: { maxToolCalls: 1 },
    }).find((tool) => tool.name === "code_executor");
    if (!codeExecutor) {
      throw new Error("Expected code_executor to be registered");
    }

    const result = await codeExecutor.execute("code-mode-limit-cap", {
      max_tool_calls: 10,
      code: [
        "await tools.tool_search({ query: 'read' });",
        "await tools.tool_search({ query: 'write' });",
        "return 'unreachable';",
      ].join("\n"),
    });

    expect(getText(result)).toBe("Error: code_executor exceeded max_tool_calls (1)");
  });

  it("processes fetched html content and exposes helper exports directly", async () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-web-"));
    const fetchMock = vi.fn(async () => ({
      headers: {
        get: (name: string) => (name === "content-type" ? "text/html; charset=utf-8" : null),
      },
      text: async () => "<html><body><h1>Title &amp; Stuff</h1><p>Alpha topic</p><p>Beta only</p></body></html>",
    }));
    vi.stubGlobal("fetch", fetchMock);

    const fetchProcessTool = getTool("fetch_process", workspace);
    const result = await fetchProcessTool.execute("call-fetch-process", {
      url: "https://example.com",
      prompt: "Alpha",
      format: "markdown",
    });
    const parsed = JSON.parse(getText(result)) as { content: string; format: string };

    expect(parsed.format).toBe("markdown");
    expect(parsed.content).toContain("Alpha topic");
    expect(parsed.content).not.toContain("Beta only");

    const searchResults = parseSearchResults(
      '<a class="result__a" href="/l/?uddg=https%3A%2F%2Fexample.com%2Fdoc">Doc &amp; More</a>'
        + '<a class="result__snippet">Snippet &lt;strong&gt;text&lt;/strong&gt;</a>',
      5,
    );
    expect(searchResults).toEqual([
      {
        title: "Doc & More",
        url: "https://example.com/doc",
        snippet: "Snippet <strong>text</strong>",
      },
    ]);
    expect(stripHtmlTags("<p>A &amp; B</p>")).toBe("A & B");
    expect(
      extractTextFromHtml("<div><h1>Title &amp; Stuff</h1><p>One</p><p>Two</p></div>", "markdown"),
    ).toContain("# Title & Stuff");
    expect(filterByRelevance("Alpha text\n\nBeta text", "Alpha focus")).toBe("Alpha text");
    expect(createAgentCoreToolDefinitionsFromIndex).toBe(createAgentCoreToolDefinitions);
  });

  it("scopes ast_edit to files matching the requested glob", async () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-ast-edit-glob-"));
    const srcDir = path.join(workspace, "src");
    const testDir = path.join(workspace, "test");
    mkdirSync(srcDir, { recursive: true });
    mkdirSync(testDir, { recursive: true });
    writeFileSync(path.join(srcDir, "alpha.ts"), "const value = oldName;\n", "utf8");
    writeFileSync(path.join(srcDir, "beta.ts"), "const value = oldName;\n", "utf8");
    writeFileSync(path.join(testDir, "gamma.ts"), "const value = oldName;\n", "utf8");

    mockSpawnExit();

    const astEditTool = getTool("ast_edit", workspace);
    const result = await astEditTool.execute("call-ast-edit-glob", {
      ops: [{ pat: "oldName", rewrite: "newName" }],
      lang: "typescript",
      path: ".",
      glob: "src/*.ts",
    });

    const invokedPaths = vi.mocked(childProcess.spawn).mock.calls.map((call) => String((call[1] as string[]).at(-1)));
    expect(invokedPaths).toEqual([
      path.join(workspace, "src", "alpha.ts"),
      path.join(workspace, "src", "beta.ts"),
    ]);
    expect(getText(result)).toContain("src/alpha.ts: applied");
    expect(getText(result)).toContain("src/beta.ts: applied");
    expect(getText(result)).not.toContain("test/gamma.ts");
  });

  it("disables AskUserQuestion in non-interactive mode for simple and structured calls", async () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-ask-non-interactive-"));
    const askUserQuestionHandler = vi.fn(async () => ({ answers: [{ answer: "should not happen" }] }));
    const askTool = getToolDefinitions(workspace, {
      interactive: false,
      askUserQuestionHandler,
    }).find((tool) => tool.name === "AskUserQuestion");

    if (!askTool) {
      throw new Error("Expected AskUserQuestion tool to be registered");
    }

    const simpleResult = await askTool.execute("ask-simple", {
      mode: "simple",
      question: "What should happen?",
    });
    const structuredResult = await askTool.execute("ask-structured", {
      mode: "structured",
      questions: [
        {
          id: "choice",
          question: "Pick one",
          options: [{ label: "A" }, { label: "B" }],
        },
      ],
    });

    expect(getText(simpleResult)).toBe("Error: AskUserQuestion is unavailable when interactive=false.");
    expect(getText(structuredResult)).toBe("Error: AskUserQuestion is unavailable when interactive=false.");
    expect(askUserQuestionHandler).not.toHaveBeenCalled();
  });

  it("delegates AskUserQuestion in interactive mode for simple and structured calls", async () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-ask-interactive-"));
    const askUserQuestionHandler = vi.fn()
      .mockResolvedValueOnce({ answers: [{ answer: "Ship it" }] })
      .mockResolvedValueOnce({ answers: [{ id: "choice", answer: "B" }] });
    const askTool = getToolDefinitions(workspace, {
      interactive: true,
      askUserQuestionHandler,
    }).find((tool) => tool.name === "AskUserQuestion");

    if (!askTool) {
      throw new Error("Expected AskUserQuestion tool to be registered");
    }

    const simpleResult = await askTool.execute("ask-simple", {
      mode: "simple",
      question: "What should happen?",
    });
    const structuredResult = await askTool.execute("ask-structured", {
      mode: "structured",
      questions: [
        {
          id: "choice",
          question: "Pick one",
          options: [{ label: "A" }, { label: "B" }],
          multi: false,
          recommended: 1,
        },
      ],
    });

    expect(getText(simpleResult)).toBe("Ship it");
    expect(JSON.parse(getText(structuredResult))).toEqual({
      answers: [{ id: "choice", answer: "B" }],
    });
    expect(askUserQuestionHandler).toHaveBeenNthCalledWith(1, {
      questions: [
        {
          id: "_simple",
          text: "What should happen?",
          options: undefined,
          allowMultiple: false,
          recommendedIndex: undefined,
        },
      ],
    });
    expect(askUserQuestionHandler).toHaveBeenNthCalledWith(2, {
      questions: [
        {
          id: "choice",
          text: "Pick one",
          options: [
            { value: "A", label: "A" },
            { value: "B", label: "B" },
          ],
          allowMultiple: false,
          recommendedIndex: 1,
        },
      ],
    });
  });

  it("normalizes rejected async tool executions into error tool results", async () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-task-rejection-"));
    const taskHandler = vi.fn(async () => {
      throw new Error("worker exploded");
    });
    const taskTool = getToolDefinitions(workspace, {
      taskHandler,
    }).find((tool) => tool.name === "task");

    if (!taskTool) {
      throw new Error("Expected task tool to be registered");
    }

    const result = await taskTool.execute("task-rejection", {
      task: "run failing worker",
    });

    expect(getText(result)).toBe("Error: worker exploded");
    expect(taskHandler).toHaveBeenCalledOnce();
  });

  it("normalizes timeout-driven fetch aborts into cancellation tool results", async () => {
    vi.useFakeTimers();
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-fetch-timeout-"));
    const fetchMock = vi.fn((_url: string, init?: { signal?: AbortSignal }) => new Promise((_, reject) => {
      init?.signal?.addEventListener("abort", () => {
        const error = new Error("This operation was aborted");
        error.name = "AbortError";
        reject(error);
      }, { once: true });
    }));
    vi.stubGlobal("fetch", fetchMock);

    const fetchTool = getTool("fetch", workspace);
    const resultPromise = fetchTool.execute("fetch-timeout", {
      url: "https://example.com/slow",
      timeout: 5,
    });

    await vi.advanceTimersByTimeAsync(5);

    const result = await resultPromise;
    expect(getText(result)).toBe("Error: Tool execution was cancelled.");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("preserves fetch timeout cancellation when a shared AbortSignal is supplied", async () => {
    vi.useFakeTimers();
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-fetch-shared-timeout-"));
    const controller = new AbortController();
    const fetchMock = vi.fn((_url: string, init?: { signal?: AbortSignal }) => new Promise((_, reject) => {
      init?.signal?.addEventListener("abort", () => {
        const error = new Error("This operation was aborted");
        error.name = "AbortError";
        reject(error);
      }, { once: true });
    }));
    vi.stubGlobal("fetch", fetchMock);

    const fetchTool = getTool("fetch", workspace);
    const resultPromise = fetchTool.execute(
      "fetch-shared-timeout",
      {
        url: "https://example.com/slow",
        timeout: 5,
      },
      undefined,
      { signal: controller.signal },
    );

    await vi.advanceTimersByTimeAsync(5);

    const result = await resultPromise;
    expect(getText(result)).toBe("Error: Tool execution was cancelled.");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(controller.signal.aborted).toBe(false);
  });

  it("uses opt-in read-only fetch cache without writing side-effectful entries", async () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-fetch-cache-"));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const cache = {
      get: vi.fn(async () => ({
        status: 200,
        statusText: "OK",
        body: "cached body",
      })),
    };

    const fetchTool = getToolDefinitions(workspace, { cache }).find((tool) => tool.name === "fetch");
    const bashTool = getToolDefinitions(workspace, { cache }).find((tool) => tool.name === "bash");
    if (!fetchTool || !bashTool) {
      throw new Error("Expected fetch and bash tools to be registered");
    }

    const result = await fetchTool.execute("fetch-cache", {
      url: "https://example.com/cacheable",
    });
    const parsed = JSON.parse(getText(result)) as { body: string; cache: { hit: boolean; mode: string } };

    expect(parsed.body).toBe("cached body");
    expect(parsed.cache).toMatchObject({ hit: true, mode: "read-only" });
    expect(cache.get).toHaveBeenCalledWith(
      "agent-core:fetch:https://example.com/cacheable:truncated",
      undefined,
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(bashTool.metadata?.cache).toBeUndefined();
  });

  it("caps ast_edit rewrites to the requested file limit", async () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-ast-edit-limit-"));
    const srcDir = path.join(workspace, "src");
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(path.join(srcDir, "alpha.ts"), "const value = oldName;\n", "utf8");
    writeFileSync(path.join(srcDir, "beta.ts"), "const value = oldName;\n", "utf8");
    writeFileSync(path.join(srcDir, "gamma.ts"), "const value = oldName;\n", "utf8");

    mockSpawnExit();

    const astEditTool = getTool("ast_edit", workspace);
    const result = await astEditTool.execute("call-ast-edit-limit", {
      ops: [{ pat: "oldName", rewrite: "newName" }],
      lang: "typescript",
      path: "src",
      glob: "*.ts",
      limit: 2,
    });

    const invokedPaths = vi.mocked(childProcess.spawn).mock.calls.map((call) => String((call[1] as string[]).at(-1)));
    expect(invokedPaths).toEqual([
      path.join(workspace, "src", "alpha.ts"),
      path.join(workspace, "src", "beta.ts"),
    ]);
    expect(getText(result)).toContain("src/alpha.ts: applied");
    expect(getText(result)).toContain("src/beta.ts: applied");
    expect(getText(result)).not.toContain("src/gamma.ts");
  });

  it("scopes background task state and limits per tool-definition set", async () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-background-scope-"));
    const sessionOneComplete = vi.fn();
    const sessionTwoComplete = vi.fn();
    const spawned: Array<{
      processHandle: childProcess.ChildProcessWithoutNullStreams & { kill: ReturnType<typeof vi.fn> };
      stdout: PassThrough;
      stderr: PassThrough;
    }> = [];

    const mockSpawn = vi.fn((() => {
      const processHandle = new PassThrough() as unknown as childProcess.ChildProcessWithoutNullStreams & {
        kill: ReturnType<typeof vi.fn>;
      };
      const stdout = new PassThrough();
      const stderr = new PassThrough();
      Object.assign(processHandle, {
        stdout,
        stderr,
        pid: spawned.length + 100,
        kill: vi.fn(),
      });
      spawned.push({ processHandle, stdout, stderr });
      return processHandle;
    }) as unknown as typeof childProcess.spawn);

    const sessionOneTools = getToolDefinitions(workspace, {
      backgroundRegistry: new BackgroundProcessRegistry({ maxConcurrent: 1, spawnFn: mockSpawn as any}),
      onBackgroundComplete: sessionOneComplete,
    });
    const sessionTwoTools = getToolDefinitions(workspace, {
      backgroundRegistry: new BackgroundProcessRegistry({ maxConcurrent: 2, spawnFn: mockSpawn as any}),
      onBackgroundComplete: sessionTwoComplete,
    });
    const sessionOneBash = sessionOneTools.find((tool) => tool.name === "bash");
    const sessionOneList = sessionOneTools.find((tool) => tool.name === "background_list");
    const sessionTwoBash = sessionTwoTools.find((tool) => tool.name === "bash");
    const sessionTwoList = sessionTwoTools.find((tool) => tool.name === "background_list");

    if (!sessionOneBash || !sessionOneList || !sessionTwoBash || !sessionTwoList) {
      throw new Error("Expected background tools to be registered");
    }

    await sessionOneBash.execute("session-one-first", {
      command: "sleep 1",
      run_in_background: true,
      description: "session-one",
    });
    await sessionTwoBash.execute("session-two-first", {
      command: "sleep 1",
      run_in_background: true,
      description: "session-two-first",
    });
    await sessionTwoBash.execute("session-two-second", {
      command: "sleep 1",
      run_in_background: true,
      description: "session-two-second",
    });

    const overLimitResult = await sessionOneBash.execute("session-one-over-limit", {
      command: "sleep 1",
      run_in_background: true,
    });
    expect(getText(overLimitResult)).toContain("Max concurrent background processes limit reached (1)");

    const sessionOneTasks = JSON.parse(getText(await sessionOneList.execute("session-one-list", {}))) as {
      tasks: Array<{ description?: string }>;
    };
    const sessionTwoTasks = JSON.parse(getText(await sessionTwoList.execute("session-two-list", {}))) as {
      tasks: Array<{ description?: string }>;
    };

    expect(sessionOneTasks.tasks).toHaveLength(1);
    expect(sessionOneTasks.tasks[0]?.description).toBe("session-one");
    expect(sessionTwoTasks.tasks).toHaveLength(2);
    expect(sessionTwoTasks.tasks.map((task) => task.description)).toEqual([
      "session-two-first",
      "session-two-second",
    ]);

    spawned[0]?.stdout.write("first done");
    spawned[0]?.stdout.end();
    spawned[0]?.stderr.end();
    (spawned[0]?.processHandle as unknown as PassThrough).emit("close", 0);

    spawned[1]?.stdout.write("second done");
    spawned[1]?.stdout.end();
    spawned[1]?.stderr.end();
    (spawned[1]?.processHandle as unknown as PassThrough).emit("close", 0);

    spawned[2]?.stdout.write("third done");
    spawned[2]?.stdout.end();
    spawned[2]?.stderr.end();
    (spawned[2]?.processHandle as unknown as PassThrough).emit("close", 0);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(sessionOneComplete).toHaveBeenCalledTimes(1);
    expect(sessionTwoComplete).toHaveBeenCalledTimes(2);
  });

  it("releases retained background task state when tool definitions are disposed", async () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "agent-core-background-dispose-"));
    const spawned: Array<{
      processHandle: childProcess.ChildProcessWithoutNullStreams & { kill: ReturnType<typeof vi.fn> };
      stdout: PassThrough;
      stderr: PassThrough;
    }> = [];

    const mockSpawn = vi.fn((() => {
      const processHandle = new PassThrough() as unknown as childProcess.ChildProcessWithoutNullStreams & {
        kill: ReturnType<typeof vi.fn>;
      };
      const stdout = new PassThrough();
      const stderr = new PassThrough();
      Object.assign(processHandle, {
        stdout,
        stderr,
        pid: spawned.length + 200,
        kill: vi.fn(),
      });
      spawned.push({ processHandle, stdout, stderr });
      return processHandle;
    }) as unknown as typeof childProcess.spawn);

    const definitions = getToolDefinitions(workspace, {
      backgroundRegistry: new BackgroundProcessRegistry({ maxConcurrent: 1, spawnFn: mockSpawn as any}),
    });
    const bashTool = definitions.find((tool) => tool.name === "bash");
    const listTool = definitions.find((tool) => tool.name === "background_list");

    if (!bashTool || !listTool) {
      throw new Error("Expected background tools to be registered");
    }

    await bashTool.execute("background-first", {
      command: "sleep 1",
      run_in_background: true,
      description: "retained-output",
    });

    spawned[0]?.stdout.write("captured output");
    spawned[0]?.stdout.end();
    spawned[0]?.stderr.end();
    (spawned[0]?.processHandle as unknown as PassThrough).emit("close", 0);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const beforeDispose = JSON.parse(getText(await listTool.execute("background-list-before-dispose", {}))) as {
      tasks: Array<{ stdout: string; status: string }>;
    };
    expect(beforeDispose.tasks).toHaveLength(1);
    expect(beforeDispose.tasks[0]?.stdout).toBe("captured output");
    expect(beforeDispose.tasks[0]?.status).toBe("completed");

    disposeAgentCoreToolDefinitions([...definitions]);

    const afterDispose = JSON.parse(getText(await listTool.execute("background-list-after-dispose", {}))) as {
      tasks: unknown[];
    };
    expect(afterDispose.tasks).toEqual([]);
  });
});
