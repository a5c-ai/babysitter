import type { UnifiedHookResult } from '../types/result';
import type { McpToolHandlerRef } from '../types/plan';
import { HandlerError } from '../normalizer/errors';
import { parseHandlerResult, withTimeout, type HandlerRuntimeContext } from './shared';

export interface McpToolExecutionRequest {
  server: string;
  tool: string;
  args: Record<string, unknown>;
}

export type McpToolExecutor = (
  request: McpToolExecutionRequest,
  context: HandlerRuntimeContext,
) => Promise<UnifiedHookResult | string | Record<string, unknown>> | UnifiedHookResult | string | Record<string, unknown>;

function parseMcpToolResult(value: unknown): UnifiedHookResult {
  const parsed = parseHandlerResult(value);
  if (parsed.decision || parsed.reason || parsed.metadata) {
    return parsed;
  }

  return {
    decision: 'noop',
    metadata: {
      handlerType: 'mcp_tool',
      toolResult: value,
    },
  };
}

export async function runMcpToolHandler(
  ref: McpToolHandlerRef,
  context: HandlerRuntimeContext,
  executor?: McpToolExecutor,
): Promise<UnifiedHookResult> {
  if (!executor) {
    throw new HandlerError('mcp_tool handler requires an injected executor', {
      source: `${ref.server}:${ref.tool}`,
      handler: 'mcp_tool',
      code: 'MCP_EXECUTOR_MISSING',
    });
  }

  try {
    const result = await withTimeout(`${ref.server}:${ref.tool}`, 'mcp_tool', context.timeoutMs, (signal) => executor({
      server: ref.server,
      tool: ref.tool,
      args: ref.args ?? {},
    }, { ...context, signal }));

    return parseMcpToolResult(result);
  } catch (err) {
    if (err instanceof HandlerError) {
      throw err;
    }
    throw new HandlerError(
      err instanceof Error ? err.message : String(err),
      {
        source: `${ref.server}:${ref.tool}`,
        handler: 'mcp_tool',
        code: 'MCP_TOOL_ERROR',
        cause: err,
      },
    );
  }
}
