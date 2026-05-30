import { describe, expect, it, vi } from "vitest";
import { ToolDispatcher, ToolRegistry } from "@a5c-ai/tool-mux";
import { createMcpToolDispatcherExecutor, McpToolExecutor } from "./executor";

describe("McpToolExecutor dispatcher integration", () => {
  it("executes MCP descriptors through McpToolExecutor via ToolDispatcher", async () => {
    const registry = new ToolRegistry();
    registry.register({
      name: "search",
      description: "Search docs",
      source: "mcp",
      sourceQualifier: "docs",
      server: "docs",
      parameters: { type: "object" },
    });
    const dispatcher = new ToolDispatcher({ registry });
    const manager = {
      callTool: vi.fn(async () => ({
        success: true,
        content: [{ type: "text", text: "ok" }],
      })),
    };
    const executor = new McpToolExecutor(manager as never);

    const result = await dispatcher.dispatch(
      {
        toolName: "mcp:docs:search",
        input: { query: "registry" },
        caller: "test",
      },
      createMcpToolDispatcherExecutor(executor),
    );

    expect(result.error).toBeUndefined();
    expect(result.output).toEqual({
      success: true,
      content: [{ type: "text", text: "ok" }],
      durationMs: expect.any(Number),
    });
    expect(manager.callTool).toHaveBeenCalledWith("docs", "search", { query: "registry" });
  });
});
