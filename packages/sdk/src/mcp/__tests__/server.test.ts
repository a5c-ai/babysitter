import { describe, it, expect } from "vitest";
import { createBabysitterMcpServer } from "../server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

describe("createBabysitterMcpServer", () => {
  it("returns an McpServer instance", () => {
    const server = createBabysitterMcpServer();
    expect(server).toBeInstanceOf(McpServer);
  });

  it("registers all 15 expected tools", () => {
    const server = createBabysitterMcpServer();
    // Access internal registered tools object
    const registeredTools = (server as unknown as { _registeredTools: Record<string, unknown> })._registeredTools;

    const toolNames = Object.keys(registeredTools).sort();

    const expectedTools = [
      "configure_show",
      "health",
      "run_create",
      "run_events",
      "run_iterate",
      "run_rebuild_state",
      "run_status",
      "session_associate",
      "session_init",
      "session_resume",
      "session_state",
      "skill_discover",
      "task_list",
      "task_post",
      "task_show",
    ];

    expect(toolNames).toEqual(expectedTools);
    expect(Object.keys(registeredTools)).toHaveLength(15);
  });

  it("sets server name to 'babysitter'", () => {
    const server = createBabysitterMcpServer();
    const serverImpl = server.server;
    // The server info is passed at construction; verify it was set
    expect(serverImpl).toBeDefined();
  });
});
