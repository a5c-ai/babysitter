/**
 * mcp:serve command - Launch the babysitter MCP server on stdio transport.
 *
 * stdout is reserved for MCP protocol messages; all logging goes to stderr.
 * WebSocket transport is available via @a5c-ai/babysitter-agent.
 */

import { createBabysitterMcpServer } from "../../mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

function installShutdownHandlers(shutdownFn: () => Promise<void>): void {
  process.on("SIGINT", () => void shutdownFn());
  process.on("SIGTERM", () => void shutdownFn());
}

export async function handleMcpServe(args: {
  json: boolean;
  transport?: string;
}): Promise<number> {
  const transportType = args.transport ?? "stdio";

  if (transportType === "ws" || transportType === "websocket") {
    process.stderr.write(
      "WebSocket transport has moved to @a5c-ai/babysitter-agent.\n" +
      "Use babysitter-agent mcp:serve --transport websocket instead.\n",
    );
    return 1;
  }

  const server = createBabysitterMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.stderr.write(
    args.json
      ? JSON.stringify({ status: "running", transport: "stdio" }) + "\n"
      : "Babysitter MCP server running on stdio\n",
  );

  installShutdownHandlers(async () => {
    process.stderr.write("Shutting down MCP server...\n");
    await server.close();
    process.exit(0);
  });

  return await new Promise<number>(() => {});
}
