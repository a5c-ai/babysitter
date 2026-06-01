import type { CustomToolDefinition, ToolResult } from "../types";

export const TOOL_CANCELLED_MESSAGE = "Tool execution was cancelled.";

export function ok(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

export function jsonResult(data: unknown): ToolResult {
  return ok(JSON.stringify(data, null, 2));
}

export function errorResult(message: string): ToolResult {
  return ok(`Error: ${message}`);
}

export function normalizeToolErrorMessage(error: unknown): string {
  const DOMExceptionCtor = (globalThis as { DOMException?: new (...args: any[]) => Error }).DOMException;
  if (
    (error instanceof Error && error.name === "AbortError")
    || (DOMExceptionCtor
      && error instanceof DOMExceptionCtor
      && error.name === "AbortError")
  ) {
    return TOOL_CANCELLED_MESSAGE;
  }
  return error instanceof Error ? error.message : String(error);
}

export function errorResultFor(error: unknown, prefix?: string): ToolResult {
  const message = normalizeToolErrorMessage(error);
  if (!prefix || message === TOOL_CANCELLED_MESSAGE) {
    return errorResult(message);
  }
  return errorResult(`${prefix}: ${message}`);
}

export function wrapToolDefinition(
  definition: CustomToolDefinition,
  onToolUse?: (toolName: string, params: unknown) => void,
): CustomToolDefinition {
  const originalExecute = definition.execute;
  definition.execute = async (
    toolCallId: string,
    params: Record<string, unknown>,
    onUpdate?: unknown,
    toolContext?: unknown,
  ) => {
    if (onToolUse) {
      onToolUse(definition.name, params);
    }
    try {
      return await Promise.resolve(originalExecute(toolCallId, params, onUpdate, toolContext));
    } catch (error) {
      process.stderr.write(`[agent-core] tool ${definition.name} error: ${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
      return errorResultFor(error);
    }
  };
  return definition;
}
