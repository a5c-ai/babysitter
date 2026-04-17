import type { CustomToolDefinition, ToolResult } from "../types";

export function ok(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

export function jsonResult(data: unknown): ToolResult {
  return ok(JSON.stringify(data, null, 2));
}

export function errorResult(message: string): ToolResult {
  return ok(`Error: ${message}`);
}

export function wrapToolDefinition(
  definition: CustomToolDefinition,
  onToolUse?: (toolName: string, params: unknown) => void,
): CustomToolDefinition {
  const originalExecute = definition.execute;
  definition.execute = (
    toolCallId: string,
    params: Record<string, unknown>,
    signal?: AbortSignal,
    onUpdate?: unknown,
    toolContext?: unknown,
  ) => {
    if (onToolUse) {
      onToolUse(definition.name, params);
    }
    try {
      return originalExecute(toolCallId, params, signal, onUpdate, toolContext);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return errorResult(message);
    }
  };
  return definition;
}
