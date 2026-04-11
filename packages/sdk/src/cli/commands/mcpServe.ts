/**
 * mcp:serve command - Launch the babysitter MCP server on stdio or WebSocket transport.
 *
 * stdout is reserved for MCP protocol messages; all logging goes to stderr.
 */

import { createBabysitterMcpServer } from "../../mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createWebSocketTransport } from "../../mcp/transport";

function installShutdownHandlers(shutdownFn: () => Promise<void>): void {
  process.on("SIGINT", () => void shutdownFn());
  process.on("SIGTERM", () => void shutdownFn());
}

export async function handleMcpServe(args: {
  json: boolean;
  transport?: string;
  port?: number;
  host?: string;
  authToken?: string;
  wsOptions?: {
    pingIntervalMs?: number;
    maxMessagesPerSecond?: number;
    sessionGracePeriodMs?: number;
  };
}): Promise<number> {
  const transportType = args.transport ?? "stdio";

  if (transportType === "ws" || transportType === "websocket") {
    const wsTransport = await createWebSocketTransport({
      port: args.port ?? 9600,
      host: args.host ?? "127.0.0.1",
      authToken: args.authToken,
      pingIntervalMs: args.wsOptions?.pingIntervalMs,
      maxMessagesPerSecond: args.wsOptions?.maxMessagesPerSecond,
      sessionGracePeriodMs: args.wsOptions?.sessionGracePeriodMs,
    });

    // Each new WebSocket connection gets its own McpServer instance
    wsTransport.onconnection = (connectionTransport) => {
      const server = createBabysitterMcpServer();
      void server.connect(connectionTransport);
    };

    process.stderr.write(
      args.json
        ? JSON.stringify({
            status: "running",
            transport: "websocket",
            port: wsTransport.port,
          }) + "\n"
        : `Babysitter MCP server running on WebSocket port ${wsTransport.port}\n`,
    );

    installShutdownHandlers(async () => {
      process.stderr.write("Shutting down MCP server...\n");
      await wsTransport.close();
      process.exit(0);
    });

    return await new Promise<number>(() => {});
  }

  // Default: stdio transport
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
