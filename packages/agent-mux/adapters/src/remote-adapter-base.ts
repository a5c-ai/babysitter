/**
 * BaseRemoteAdapter — abstract base class for remote (HTTP/WebSocket/Unix) adapters.
 *
 * Provides shared utilities for connection management, server lifecycle,
 * and common remote adapter functionality.
 */

import type {
  AgentName,
  AgentCapabilities,
  ModelCapabilities,
  AgentConfig,
  AgentConfigSchema,
  AuthState,
  AuthSetupGuidance,
  Session,
  InstalledPlugin,
  PluginInstallOptions,
  PluginSearchOptions,
  PluginListing,
  RunOptions,
  RemoteAdapter,
  RemoteConnection,
  ServerOptions,
  ServerInfo,
  ServerHealth,
  SpawnArgs,
  ParseContext,
  AgentEvent,
} from '@a5c-ai/agent-mux-core';

/**
 * Abstract base class for remote adapters. Provides shared utilities
 * and sensible defaults for HTTP, WebSocket, and Unix socket adapters.
 */
export abstract class BaseRemoteAdapter implements RemoteAdapter {
  // ── Adapter Type ──────────────────────────────────────────────────

  readonly adapterType = 'remote' as const;

  // ── Legacy Compatibility (for validation with old interface) ────────

  readonly cliCommand = '[remote]'; // Stub for legacy validation
  buildSpawnArgs(_options: RunOptions): SpawnArgs {
    throw new Error('buildSpawnArgs not supported on remote adapters');
  }
  parseEvent(_line: string, _context: ParseContext): AgentEvent | AgentEvent[] | null {
    throw new Error('parseEvent not supported on remote adapters');
  }

  // ── Abstract members (must be implemented by subclasses) ──────────

  abstract readonly agent: AgentName;
  abstract readonly displayName: string;
  abstract readonly connectionType: 'http' | 'websocket' | 'unix';
  abstract readonly minVersion?: string;
  abstract readonly capabilities: AgentCapabilities;
  abstract readonly models: ModelCapabilities[];
  abstract readonly defaultModelId?: string;
  abstract readonly configSchema: AgentConfigSchema;

  abstract connect(options: RunOptions): Promise<RemoteConnection>;
  abstract disconnect(connection: RemoteConnection): Promise<void>;
  abstract detectAuth(): Promise<AuthState>;
  abstract getAuthGuidance(): AuthSetupGuidance;
  abstract sessionDir(cwd?: string): string;
  abstract parseSessionFile(filePath: string): Promise<Session>;
  abstract listSessionFiles(cwd?: string): Promise<string[]>;
  abstract readConfig(cwd?: string): Promise<AgentConfig>;
  abstract writeConfig(config: Partial<AgentConfig>, cwd?: string): Promise<void>;

  // ── Optional members ──────────────────────────────────────────────

  readonly hostEnvSignals?: readonly string[];

  listPlugins?(): Promise<InstalledPlugin[]>;
  installPlugin?(pluginId: string, options?: PluginInstallOptions): Promise<InstalledPlugin>;
  uninstallPlugin?(pluginId: string): Promise<void>;
  searchPlugins?(query: string, options?: PluginSearchOptions): Promise<PluginListing[]>;

  readHostMetadata?(env: NodeJS.ProcessEnv): Record<string, string | number | boolean | null>;

  // ── Server Management (Optional) ──────────────────────────────────

  startServer?(options?: ServerOptions): Promise<ServerInfo>;
  stopServer?(serverInfo: ServerInfo): Promise<void>;
  healthCheck?(serverInfo: ServerInfo): Promise<ServerHealth>;

  // ── Protected utilities ───────────────────────────────────────────

  /**
   * Tracks active connections for cleanup.
   */
  protected activeConnections = new Map<string, RemoteConnection>();

  /**
   * Tracks managed servers for cleanup.
   */
  protected managedServers = new Map<string, ServerInfo>();

  /**
   * Register an active connection for tracking.
   */
  protected registerConnection(connection: RemoteConnection): void {
    this.activeConnections.set(connection.connectionId, connection);
  }

  /**
   * Unregister a connection (called on disconnect).
   */
  protected unregisterConnection(connectionId: string): void {
    this.activeConnections.delete(connectionId);
  }

  /**
   * Register a managed server for tracking.
   */
  protected registerServer(serverInfo: ServerInfo): void {
    this.managedServers.set(serverInfo.serverId, serverInfo);
  }

  /**
   * Unregister a server (called on stop).
   */
  protected unregisterServer(serverId: string): void {
    this.managedServers.delete(serverId);
  }

  /**
   * Cleanup all active connections and servers.
   * Should be called during adapter shutdown.
   */
  async cleanup(): Promise<void> {
    // Close all active connections
    const connectionPromises = Array.from(this.activeConnections.values()).map(
      connection => connection.close().catch(() => {}) // Ignore errors during cleanup
    );

    // Stop all managed servers
    const serverPromises = Array.from(this.managedServers.values()).map(
      server => this.stopServer?.(server).catch(() => {}) // Ignore errors during cleanup
    );

    await Promise.all([...connectionPromises, ...serverPromises]);

    this.activeConnections.clear();
    this.managedServers.clear();
  }

  /**
   * Generate a unique connection ID.
   */
  protected generateConnectionId(): string {
    return `${this.agent}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a unique server ID.
   */
  protected generateServerId(): string {
    return `${this.agent}-server-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Find an available port for server startup.
   */
  protected async findAvailablePort(startPort: number = 3000): Promise<number> {
    const net = await import('node:net');

    return new Promise((resolve, reject) => {
      const server = net.createServer();
      server.listen(startPort, () => {
        const port = (server.address() as any)?.port;
        server.close(() => resolve(port));
      });
      server.on('error', () => {
        // Port is busy, try next one
        this.findAvailablePort(startPort + 1).then(resolve).catch(reject);
      });
    });
  }
}