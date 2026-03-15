/**
 * mcp:serve command - Launch the babysitter MCP server on stdio transport.
 *
 * stdout is reserved for MCP protocol messages; all logging goes to stderr.
 */

import { createBabysitterMcpServer } from "../../mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

export async function handleMcpServe(args: { json: boolean }): Promise<number> {
  const server = createBabysitterMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.stderr.write(
    args.json
      ? JSON.stringify({ status: "running", transport: "stdio" }) + "\n"
      : "Babysitter MCP server running on stdio\n"
  );

  // Graceful shutdown on SIGINT / SIGTERM
  const shutdown = async () => {
    process.stderr.write("Shutting down MCP server...\n");
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());

  // Keep the process alive — the transport manages its own I/O loop.
  // Return a code that the CLI runner will never actually see (we exit via signal).
  return await new Promise<number>(() => {
    // intentionally never resolves
  });
}
