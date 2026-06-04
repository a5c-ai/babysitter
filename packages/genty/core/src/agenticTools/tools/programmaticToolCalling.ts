import vm from "node:vm";
import { Type } from "@sinclair/typebox";
import type { AgenticToolOptions, CustomToolDefinition, ToolResult, ToolUpdateEvent } from "../types";
import { jsonResult } from "../shared/results";

const DEFAULT_TIMEOUT_MS = 120_000;
// Prevents infinite tool-calling loops. 25 is high enough for complex multi-step work
// but low enough to catch runaway recursion.
const DEFAULT_MAX_TOOL_CALLS = 25;

interface ExecutorConfig {
  timeout: number;
  maxToolCalls: number;
}

interface ToolCallRecord {
  tool: string;
  params: Record<string, unknown>;
}

export function shouldEnableProgrammaticToolCalling(options: AgenticToolOptions): boolean {
  return Boolean(options.programmaticToolCalling);
}

export function createProgrammaticToolCallingTool(
  options: AgenticToolOptions,
  availableTools: CustomToolDefinition[],
): CustomToolDefinition {
  const config = resolveExecutorConfig(options);
  const callableTools = availableTools.filter((tool) => tool.name !== "code_executor");

  return {
    name: "code_executor",
    label: "Programmatic Tool Calling",
    description: [
      "Execute a JavaScript tool chain against the agent-core tool surface.",
      "Use tools.<name>(params) or callTool(name, params) to batch discovery,",
      "fetch, filesystem, shell, web, and other enabled tools in one request.",
    ].join(" "),
    promptSnippet: [
      "Programmatic Tool Calling is available through code_executor.",
      "Write JavaScript inside an async function body and return the final value.",
      "Call agent-core tools with await tools.read({ path: 'README.md' }) or await callTool('tool_search', { query: 'git' }).",
    ].join("\n"),
    parameters: Type.Object({
      code: Type.String({
        description: "JavaScript async function body. Use return <value> for the final result.",
      }),
      timeout: Type.Optional(Type.Number({ description: `Timeout in ms (default: ${config.timeout})` })),
      max_tool_calls: Type.Optional(Type.Number({
        description: `Maximum nested tool calls (default: ${config.maxToolCalls})`,
      })),
    }),
    execute: async (_toolCallId, params, onUpdate, toolContext) => {
      const calls: ToolCallRecord[] = [];
      const timeout = resolveInvocationLimit(params.timeout, config.timeout);
      const maxToolCalls = resolveInvocationLimit(params.max_tool_calls, config.maxToolCalls);
      const logs: string[] = [];
      const toolMap = new Map(callableTools.map((tool) => [tool.name, tool]));

      const callTool = async (name: string, toolParams: Record<string, unknown> = {}) => {
        if (calls.length >= maxToolCalls) {
          throw new Error(`code_executor exceeded max_tool_calls (${maxToolCalls})`);
        }
        const tool = toolMap.get(name);
        if (!tool) {
          throw new Error(`Tool "${name}" is not available to code_executor.`);
        }
        calls.push({ tool: name, params: toolParams });
        const executeDirectly = async () => unwrapToolResult(await tool.execute(
          `code-executor:${calls.length}:${name}`,
          toolParams,
          onUpdate,
          toolContext,
        ));
        if (!options.toolDispatcher) {
          return executeDirectly();
        }
        const dispatched = await options.toolDispatcher.dispatch(
          {
            toolName: name,
            input: toolParams,
            caller: "code_executor",
            signal: typeof toolContext === "object" && toolContext && "signal" in toolContext
              ? toolContext.signal as AbortSignal | undefined
              : undefined,
            onUpdate: onUpdate as ((event: ToolUpdateEvent) => void | Promise<void>) | undefined,
          },
          async () => executeDirectly(),
        );
        if (dispatched.error) {
          throw new Error(typeof dispatched.error === "string" ? dispatched.error : dispatched.error.message ?? "Tool dispatch failed");
        }
        return dispatched.output;
      };

      const tools = Object.create(null) as Record<string, (toolParams?: Record<string, unknown>) => Promise<unknown>>;
      for (const tool of callableTools) {
        tools[tool.name] = (toolParams: Record<string, unknown> = {}) => callTool(tool.name, toolParams);
      }

      const context = vm.createContext({
        callTool,
        tools,
        console: {
          log: (...items: unknown[]) => logs.push(items.map(stringifyLogItem).join(" ")),
          error: (...items: unknown[]) => logs.push(items.map(stringifyLogItem).join(" ")),
          warn: (...items: unknown[]) => logs.push(items.map(stringifyLogItem).join(" ")),
        },
      });

      const script = new vm.Script(`(async () => {\n${String(params.code ?? "")}\n})()`);
      const startedAt = Date.now();
      const result = await withTimeout(Promise.resolve(script.runInContext(context, { timeout })), timeout);

      return jsonResult({
        result,
        logs,
        toolCalls: calls,
        duration: Date.now() - startedAt,
      });
    },
  };
}

function resolveInvocationLimit(value: unknown, configuredLimit: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return configuredLimit;
  }
  return Math.min(Math.floor(value), configuredLimit);
}

function resolveExecutorConfig(options: AgenticToolOptions): ExecutorConfig {
  const configured = options.programmaticToolCalling;
  if (configured && typeof configured === "object") {
    return {
      timeout: configured.timeout ?? DEFAULT_TIMEOUT_MS,
      maxToolCalls: configured.maxToolCalls ?? DEFAULT_MAX_TOOL_CALLS,
    };
  }
  return {
    timeout: DEFAULT_TIMEOUT_MS,
    maxToolCalls: DEFAULT_MAX_TOOL_CALLS,
  };
}

async function withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`code_executor timed out after ${timeout}ms`)), timeout);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

function unwrapToolResult(result: ToolResult): unknown {
  const text = result.content.map((item) => item.text).join("\n");
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function stringifyLogItem(item: unknown): string {
  if (typeof item === "string") {
    return item;
  }
  try {
    return JSON.stringify(item);
  } catch {
    return String(item);
  }
}
