export { createBabysitterMcpServer } from "./server";

// MCP Client moved to @a5c-ai/babysitter-agent (GAP-REMOTE-006, GAP-TOOLS-025)
// MCP WebSocket transport moved to @a5c-ai/babysitter-agent (GAP-REMOTE-003)
// MCP Channels moved to @a5c-ai/babysitter-agent (interactive feature)

/**
 * Start the MCP server on stdio transport.
 * This is the main entry point for running the babysitter MCP server.
 */
export async function startStdioServer(): Promise<void> {
  const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
  const { createBabysitterMcpServer } = await import("./server");
  const server = createBabysitterMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
