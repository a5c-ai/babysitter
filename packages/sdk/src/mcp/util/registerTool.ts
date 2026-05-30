import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { z } from "zod/v3";

export type McpToolConfig = {
  description: string;
  inputSchema: Record<string, z.ZodTypeAny>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type McpToolHandler = (args: any) => unknown;

export function registerMcpTool(
  server: McpServer,
  name: string,
  config: McpToolConfig,
  handler: McpToolHandler,
): void {
  const registerTool = server.registerTool as unknown as (
    toolName: string,
    toolConfig: McpToolConfig,
    toolHandler: McpToolHandler,
  ) => unknown;
  registerTool.call(server, name, config, handler);
}
