/**
 * Local MCP server factory for the genty CLI.
 *
 * Constructs an McpServer instance with babysitter tool registrations.
 * The underlying tool registration functions are still sourced from the SDK
 * until they are individually migrated to @a5c-ai/genty-platform/mcp.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// SDK-owned: MCP server factory with babysitter tool registrations lives in SDK
import { createBabysitterMcpServer } from "@a5c-ai/babysitter-sdk";

/**
 * Create an MCP server with babysitter tools registered.
 *
 * Currently delegates to the SDK factory.  When MCP tool registrations
 * are migrated to @a5c-ai/genty-platform/mcp, this function will
 * construct the McpServer directly and call platform-level
 * register*Tools helpers instead.
 */
export function createGentyMcpServer(): McpServer {
  return createBabysitterMcpServer();
}
