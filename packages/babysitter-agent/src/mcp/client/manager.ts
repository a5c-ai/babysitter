/**
 * Status: NOT INTEGRATED YET
 * Moved from @a5c-ai/babysitter-sdk.
 * GAP-REMOTE-006: MCP Client Manager.
 *
 * Manages named MCP server connections with connect/disconnect lifecycle,
 * status tracking, and optional reconnection. The manager does NOT directly
 * depend on @modelcontextprotocol/sdk/client — instead it uses a pluggable
 * transport factory so tests and consumers can inject their own.
 */

import type {
  McpServerConfig,
  McpServerConnection,
  McpConnectionStatus,
  McpToolInfo,
  McpToolResult,
} from "./types";
import { readMcpServersConfig } from "./config";

// ---------------------------------------------------------------------------
// Transport abstraction
// ---------------------------------------------------------------------------

/**
 * Minimal transport interface that the manager uses to interact with
 * an MCP server. Consumers provide a factory that creates these.
 */
export interface McpClientTransport {
  /** Connect to the server. Throws on failure. */
  connect(): Promise<void>;
  /** Disconnect gracefully. */
  disconnect(): Promise<void>;
  /** List available tools. */
  listTools(): Promise<McpToolInfo[]>;
  /** Call a tool by name with arguments. */
  callTool(toolName: string, args: Record<string, unknown>): Promise<McpToolResult>;
}

/** Factory function that creates a transport for a given server config. */
export type McpTransportFactory = (config: McpServerConfig) => McpClientTransport;

// ---------------------------------------------------------------------------
// Manager options
// ---------------------------------------------------------------------------

export interface McpClientManagerOptions {
  /** State directory for reading mcp-servers.json. */
  stateDir: string;
  /** Factory for creating transports. */
  transportFactory: McpTransportFactory;
  /** Injectable delay function for testing (default: setTimeout-based). */
  delayFn?: (ms: number) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Internal connection record
// ---------------------------------------------------------------------------

interface ConnectionRecord {
  config: McpServerConfig;
  connection: McpServerConnection;
  transport: McpClientTransport | undefined;
  /** In-flight connect/reconnect promise to prevent concurrent attempts. */
  connectPromise: Promise<McpServerConnection> | undefined;
}

/** Default delay (ms) between reconnection attempts. */
const RECONNECT_BASE_DELAY_MS = 1000;

// ---------------------------------------------------------------------------
// McpClientManager
// ---------------------------------------------------------------------------

const defaultDelay = (ms: number): Promise<void> => new Promise<void>((resolve) => setTimeout(resolve, ms));

export class McpClientManager {
  private readonly _stateDir: string;
  private readonly _transportFactory: McpTransportFactory;
  private readonly _delay: (ms: number) => Promise<void>;
  private readonly _connections = new Map<string, ConnectionRecord>();
  private _initialized = false;

  constructor(options: McpClientManagerOptions) {
    this._stateDir = options.stateDir;
    this._transportFactory = options.transportFactory;
    this._delay = options.delayFn ?? defaultDelay;
  }

  /** Initialize the manager: load server configs, optionally auto-connect. */
  async initialize(autoConnect?: boolean): Promise<void> {
    const file = await readMcpServersConfig(this._stateDir);
    for (const config of file.servers) {
      this._connections.set(config.name, {
        config,
        connection: {
          name: config.name,
          status: "disconnected",
          lastStatusChange: new Date().toISOString(),
          reconnectAttempts: 0,
        },
        transport: undefined,
        connectPromise: undefined,
      });
    }
    this._initialized = true;

    if (autoConnect) {
      const autoServers = file.servers.filter((s) => s.autoConnect);
      await Promise.allSettled(autoServers.map((s) => this.connect(s.name)));
    }
  }

  /** Connect to a named server. Deduplicates concurrent connect attempts. */
  async connect(serverName: string): Promise<McpServerConnection> {
    const record = this._connections.get(serverName);
    if (!record) {
      throw new Error(`MCP server "${serverName}" not found in configuration`);
    }

    if (record.connection.status === "connected") {
      return record.connection;
    }

    // Deduplicate in-flight connect attempts
    if (record.connectPromise) {
      return record.connectPromise;
    }

    record.connectPromise = this._doConnect(record);
    try {
      return await record.connectPromise;
    } finally {
      record.connectPromise = undefined;
    }
  }

  /**
   * Attempt reconnection for a server that was previously connected.
   * Retries up to maxReconnectAttempts with exponential backoff.
   * Deduplicates concurrent reconnect calls.
   * Returns the final connection state (may be 'error' if all retries exhausted).
   */
  async reconnect(serverName: string): Promise<McpServerConnection> {
    const record = this._connections.get(serverName);
    if (!record) {
      throw new Error(`MCP server "${serverName}" not found in configuration`);
    }

    const maxAttempts = record.config.maxReconnectAttempts ?? 3;
    if (!record.config.reconnect || maxAttempts <= 0) {
      throw new Error(`Reconnection is not enabled for server "${serverName}"`);
    }

    // Deduplicate concurrent reconnect calls
    if (record.connectPromise) {
      return record.connectPromise;
    }

    record.connectPromise = this._doReconnect(record, maxAttempts);
    try {
      return await record.connectPromise;
    } finally {
      record.connectPromise = undefined;
    }
  }

  /** Disconnect from a named server. */
  async disconnect(serverName: string): Promise<McpServerConnection> {
    const record = this._connections.get(serverName);
    if (!record) {
      throw new Error(`MCP server "${serverName}" not found in configuration`);
    }

    if (record.transport) {
      try {
        await record.transport.disconnect();
      } catch {
        // Best-effort disconnect
      }
      record.transport = undefined;
    }

    record.connectPromise = undefined;
    this._setStatus(record, "disconnected");
    record.connection.error = undefined;
    return record.connection;
  }

  /** Disconnect all servers and release resources. */
  async disconnectAll(): Promise<void> {
    const names = [...this._connections.keys()];
    await Promise.allSettled(names.map((n) => this.disconnect(n)));
  }

  /** Get connection status for a named server. */
  getConnection(serverName: string): McpServerConnection | undefined {
    return this._connections.get(serverName)?.connection;
  }

  /** List all tracked connections. */
  listConnections(): McpServerConnection[] {
    return [...this._connections.values()].map((r) => r.connection);
  }

  /** List tools available on a connected server. */
  async listTools(serverName: string): Promise<McpToolInfo[]> {
    const record = this._connections.get(serverName);
    if (!record?.transport || record.connection.status !== "connected") {
      throw new Error(`MCP server "${serverName}" is not connected`);
    }
    return record.transport.listTools();
  }

  /** Call a tool on a connected server. */
  async callTool(
    serverName: string,
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<McpToolResult> {
    const record = this._connections.get(serverName);
    if (!record?.transport || record.connection.status !== "connected") {
      throw new Error(`MCP server "${serverName}" is not connected`);
    }
    return record.transport.callTool(toolName, args);
  }

  /** Whether the manager has been initialized. */
  get initialized(): boolean {
    return this._initialized;
  }

  /** Get the config for a server. */
  getServerConfig(serverName: string): McpServerConfig | undefined {
    return this._connections.get(serverName)?.config;
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private async _doReconnect(record: ConnectionRecord, maxAttempts: number): Promise<McpServerConnection> {
    this._setStatus(record, "reconnecting");

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      record.connection.reconnectAttempts = attempt;

      // Exponential backoff: 1s, 2s, 4s, ...
      const delayMs = RECONNECT_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      await this._delay(delayMs);

      const transport = this._transportFactory(record.config);
      record.transport = transport;

      try {
        await transport.connect();
        this._setStatus(record, "connected");
        record.connection.connectedAt = new Date().toISOString();
        record.connection.reconnectAttempts = 0;
        record.connection.error = undefined;
        return record.connection;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        record.connection.error = message;
        record.transport = undefined;
      }
    }

    // All retries exhausted
    this._setStatus(record, "error");
    return record.connection;
  }

  private async _doConnect(record: ConnectionRecord): Promise<McpServerConnection> {
    this._setStatus(record, "connecting");
    const transport = this._transportFactory(record.config);
    record.transport = transport;

    try {
      await transport.connect();
      this._setStatus(record, "connected");
      record.connection.connectedAt = new Date().toISOString();
      record.connection.reconnectAttempts = 0;
      record.connection.error = undefined;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this._setStatus(record, "error");
      record.connection.error = message;
      record.transport = undefined;
      throw err;
    }

    return record.connection;
  }

  private _setStatus(record: ConnectionRecord, status: McpConnectionStatus): void {
    record.connection.status = status;
    record.connection.lastStatusChange = new Date().toISOString();
  }
}
