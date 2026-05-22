/**
 * Status: NOT INTEGRATED YET
 * Moved from @a5c-ai/babysitter-sdk.
 * GAP-REMOTE-006: MCP Client barrel exports.
 */

// Types
export type {
  McpTransportType,
  McpServerConfig,
  McpServersFile,
  McpConnectionStatus,
  McpServerConnection,
  McpToolParameterSchema,
  McpToolInfo,
  McpToolResult,
} from "./types";
export { MCP_SERVERS_SCHEMA_VERSION } from "./types";

// Config persistence
export {
  getMcpServersConfigPath,
  readMcpServersConfig,
  writeMcpServersConfig,
  upsertServerConfig,
  removeServerConfig,
  mergeMcpServersConfig,
} from "./config";

// Client manager
export {
  McpClientManager,
  type McpClientTransport,
  type McpTransportFactory,
  type McpClientManagerOptions,
} from "./manager";

// Tool registry
export {
  McpToolRegistry,
  type McpToolRegistryOptions,
} from "./toolRegistry";

// Tool executor
export {
  McpToolExecutor,
  type McpToolExecutionRequest,
} from "./executor";
