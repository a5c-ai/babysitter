/**
 * Status: NOT INTEGRATED YET
 * Moved from @a5c-ai/babysitter-sdk.
 * GAP-REMOTE-006: MCP Client types.
 *
 * Defines server configuration, connection status, and tool metadata
 * for the MCP client infrastructure.
 */

// ---------------------------------------------------------------------------
// Server configuration
// ---------------------------------------------------------------------------

/** Transport type for MCP server connections. */
export type McpTransportType = "stdio" | "streamable-http";

/** Configuration for a single named MCP server. */
export interface McpServerConfig {
  /** Unique server name (used as connection key). */
  name: string;
  /** Transport mechanism. */
  transport: McpTransportType;
  /** For stdio: command to spawn. */
  command?: string;
  /** For stdio: command arguments. */
  args?: string[];
  /** For stdio: environment variables passed to the spawned process. */
  env?: Record<string, string>;
  /** For streamable-http: base URL of the MCP server. */
  url?: string;
  /** For streamable-http: optional auth headers. */
  headers?: Record<string, string>;
  /** Whether to auto-connect on manager initialization. */
  autoConnect?: boolean;
  /** Connection timeout in milliseconds. */
  timeoutMs?: number;
  /** Whether to attempt reconnection on disconnect. */
  reconnect?: boolean;
  /** Maximum reconnection attempts before giving up. */
  maxReconnectAttempts?: number;
}

/** Persisted configuration file shape (mcp-servers.json). */
export interface McpServersFile {
  schemaVersion: string;
  servers: McpServerConfig[];
}

// ---------------------------------------------------------------------------
// Connection status
// ---------------------------------------------------------------------------

/** Lifecycle state of a server connection. */
export type McpConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

/** Runtime state for a connected (or attempted) MCP server. */
export interface McpServerConnection {
  /** Server name (matches McpServerConfig.name). */
  name: string;
  /** Current connection lifecycle state. */
  status: McpConnectionStatus;
  /** ISO timestamp of last successful connection. */
  connectedAt?: string;
  /** ISO timestamp of last status change. */
  lastStatusChange: string;
  /** Number of reconnection attempts since last successful connection. */
  reconnectAttempts: number;
  /** Error message if status is "error". */
  error?: string;
}

// ---------------------------------------------------------------------------
// Tool metadata (from MCP tool listing)
// ---------------------------------------------------------------------------

/** JSON Schema (subset) for a tool parameter. */
export interface McpToolParameterSchema {
  type: string;
  description?: string;
  properties?: Record<string, McpToolParameterSchema>;
  required?: string[];
  items?: McpToolParameterSchema;
  enum?: unknown[];
  [key: string]: unknown;
}

/** Metadata for a single tool exposed by an MCP server. */
export interface McpToolInfo {
  /** Tool name as exposed by the server. */
  name: string;
  /** Human-readable description. */
  description?: string;
  /** JSON Schema for the tool's input parameters. */
  inputSchema?: McpToolParameterSchema;
  /** Which server exposes this tool. */
  serverName: string;
}

/** Result of invoking an MCP tool. */
export interface McpToolResult {
  /** Whether the tool invocation succeeded. */
  success: boolean;
  /** Tool output content. */
  content: Array<{ type: string; text?: string; data?: string; mimeType?: string }>;
  /** Error message if success is false. */
  error?: string;
  /** Execution duration in milliseconds. */
  durationMs?: number;
}

// ---------------------------------------------------------------------------
// Schema version
// ---------------------------------------------------------------------------

export const MCP_SERVERS_SCHEMA_VERSION = "2026.01.mcp-servers-v1";
