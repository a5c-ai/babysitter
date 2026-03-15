import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerRunTools } from "./tools/runs";
import { registerTaskTools } from "./tools/tasks";
import { registerSessionTools } from "./tools/sessions";
import { registerDiscoveryTools } from "./tools/discovery";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require("../../package.json") as { version: string };

export function createBabysitterMcpServer(): McpServer {
  const server = new McpServer({
    name: "babysitter",
    version: pkg.version
  });
  registerRunTools(server);
  registerTaskTools(server);
  registerSessionTools(server);
  registerDiscoveryTools(server);
  return server;
}
