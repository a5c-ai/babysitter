/**
 * Status: Integrated with agent-platform MCP orchestration wiring.
 * Moved from @a5c-ai/babysitter-sdk.
 * GAP-TOOLS-025: MCP Tool Executor.
 *
 * Executes MCP tools via the McpClientManager, providing a simplified
 * interface for tool invocation with timing and error handling.
 */

import type { McpToolResult } from "./types";
import type { McpClientManager } from "./manager";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface McpToolExecutionRequest {
  /** Server name (must be connected). */
  serverName: string;
  /** Tool name as exposed by the server. */
  toolName: string;
  /** Tool arguments. */
  args: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// McpToolExecutor
// ---------------------------------------------------------------------------

export class McpToolExecutor {
  private readonly _manager: McpClientManager;

  constructor(manager: McpClientManager) {
    this._manager = manager;
  }

  /** Execute an MCP tool and return the result with timing. */
  async execute(request: McpToolExecutionRequest): Promise<McpToolResult> {
    const start = Date.now();
    try {
      const result = await this._manager.callTool(
        request.serverName,
        request.toolName,
        request.args,
      );
      return {
        ...result,
        durationMs: Date.now() - start,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      process.stderr.write(`[babysitter] MCP tool ${request.toolName} execution error: ${message}\n`);
      return {
        success: false,
        content: [{ type: "text", text: message }],
        error: message,
        durationMs: Date.now() - start,
      };
    }
  }

  /**
   * Execute an MCP tool by qualified name "server:tool".
   * Convenience wrapper around execute().
   */
  async executeByQualifiedName(
    qualifiedName: string,
    args: Record<string, unknown>,
  ): Promise<McpToolResult> {
    const colonIdx = qualifiedName.indexOf(":");
    if (colonIdx < 0) {
      return {
        success: false,
        content: [{ type: "text", text: `Invalid qualified tool name "${qualifiedName}" — expected "server:tool"` }],
        error: `Invalid qualified tool name "${qualifiedName}" — expected "server:tool"`,
      };
    }
    return this.execute({
      serverName: qualifiedName.slice(0, colonIdx),
      toolName: qualifiedName.slice(colonIdx + 1),
      args,
    });
  }
}
