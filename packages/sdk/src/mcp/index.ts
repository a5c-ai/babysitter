import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
export { createBabysitterMcpServer } from "./server";
export { createWebSocketTransport, authenticateUpgrade, WebSocketSessionManager } from "./transport";
export type { WebSocketServerTransport, WebSocketTransportOptions, WebSocketSession } from "./transport";

/**
 * Start the MCP server on stdio transport.
 * This is the main entry point for running the babysitter MCP server.
 */
export async function startStdioServer(): Promise<void> {
  const { createBabysitterMcpServer } = await import("./server");
  const server = createBabysitterMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
