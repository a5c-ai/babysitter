/**
 * Multi-type adapter architecture interfaces.
 *
 * Extends agent-mux to support subprocess, remote (HTTP/WebSocket), and
 * programmatic (SDK) adapter types beyond the original subprocess-only model.
 *
 * @see ../../../docs/18-multi-adapter-architecture.md
 */

import type { AgentName } from './types.js';
import type { AgentCapabilities, ModelCapabilities } from './capabilities.js';
import type { RunOptions } from './run-options.js';
import type { AgentEvent } from './events.js';
import type { InteractionResponse } from './interaction.js';
import type { AuthState, AuthSetupGuidance, AgentConfig, AgentConfigSchema, Session } from './adapter.js';

// ---------------------------------------------------------------------------
// Base Adapter Interface
// ---------------------------------------------------------------------------

/**
 * Base interface shared across all adapter types.
 * Contains common functionality independent of execution method.
 */
export interface BaseAgentAdapterInterface {
  // ── Identity ──────────────────────────────────────────────────────

  readonly agent: AgentName;
  readonly displayName: string;
  readonly adapterType: 'subprocess' | 'remote' | 'programmatic';
  readonly minVersion?: string;

  // ── Capabilities ──────────────────────────────────────────────────

  readonly capabilities: AgentCapabilities;
  readonly models: ModelCapabilities[];
  readonly defaultModelId?: string;
  readonly configSchema: AgentConfigSchema;

  // ── Authentication ────────────────────────────────────────────────

  detectAuth(): Promise<AuthState>;
  getAuthGuidance(): AuthSetupGuidance;

  // ── Session Management ────────────────────────────────────────────

  sessionDir(cwd?: string): string;
  parseSessionFile(filePath: string): Promise<Session>;
  listSessionFiles(cwd?: string): Promise<string[]>;

  // ── Configuration ─────────────────────────────────────────────────

  readConfig(cwd?: string): Promise<AgentConfig>;
  writeConfig(config: Partial<AgentConfig>, cwd?: string): Promise<void>;

  /** Optional adapter-native model discovery hook used by ModelRegistry.refresh(). */
  discoverModels?(cwd?: string): Promise<ModelCapabilities[]>;

  // ── Host Detection ────────────────────────────────────────────────

  /** Env-var names that indicate the current process is running under this harness. */
  readonly hostEnvSignals?: readonly string[];

  /** Extract adapter-specific metadata from an env snapshot. */
  readHostMetadata?(env: NodeJS.ProcessEnv): Record<string, string | number | boolean | null>;
}

// ---------------------------------------------------------------------------
// Subprocess Adapter (Current Model)
// ---------------------------------------------------------------------------

// Import the legacy adapter interface for compatibility
import type { AgentAdapter as LegacyAgentAdapter } from './adapter.js';

/**
 * Subprocess-based adapter (traditional agent-mux model).
 * Spawns CLI process and parses line-based output.
 */
export interface SubprocessAdapter extends LegacyAgentAdapter {
  readonly adapterType: 'subprocess';
}

// SpawnArgs and ParseContext are now available through LegacyAgentAdapter import

// ---------------------------------------------------------------------------
// Remote Adapter (HTTP/WebSocket/Unix)
// ---------------------------------------------------------------------------

/**
 * Remote adapter for HTTP APIs, WebSocket connections, or Unix sockets.
 * Manages persistent connections and may handle server lifecycle.
 */
export interface RemoteAdapter extends LegacyAgentAdapter {
  readonly adapterType: 'remote';
  readonly connectionType: 'http' | 'websocket' | 'unix';

  connect(options: RunOptions): Promise<RemoteConnection>;
  disconnect(connection: RemoteConnection): Promise<void>;

  // Optional server management (if adapter controls server lifecycle)
  startServer?(options?: ServerOptions): Promise<ServerInfo>;
  stopServer?(serverInfo: ServerInfo): Promise<void>;
  healthCheck?(serverInfo: ServerInfo): Promise<ServerHealth>;
}

/**
 * Connection abstraction for remote adapters.
 */
export interface RemoteConnection {
  readonly connectionId: string;
  readonly connectionType: 'http' | 'websocket' | 'unix';
  readonly endpoint: string;

  send(data: unknown): Promise<void>;
  receive(): AsyncIterableIterator<AgentEvent>;
  close(): Promise<void>;
}

/**
 * HTTP-specific connection with REST API methods.
 */
export interface HttpConnection extends RemoteConnection {
  readonly connectionType: 'http';
  readonly baseUrl: string;

  get(path: string, params?: Record<string, unknown>): Promise<unknown>;
  post(path: string, data?: unknown): Promise<unknown>;
  put(path: string, data?: unknown): Promise<unknown>;
  delete(path: string): Promise<unknown>;

  // Streaming endpoints (Server-Sent Events)
  stream(path: string, data?: unknown): AsyncIterableIterator<AgentEvent>;
}

/**
 * WebSocket-specific connection with pub/sub capabilities.
 */
export interface WebSocketConnection extends RemoteConnection {
  readonly connectionType: 'websocket';
  readonly websocketUrl: string;

  subscribe(channel: string): AsyncIterableIterator<AgentEvent>;
  unsubscribe(channel: string): Promise<void>;
  send(message: WebSocketMessage): Promise<void>;
}

export interface WebSocketMessage {
  type: string;
  channel?: string;
  data: unknown;
}

// ---------------------------------------------------------------------------
// Programmatic Adapter (Direct SDK)
// ---------------------------------------------------------------------------

/**
 * Programmatic adapter for direct SDK integration.
 * No subprocess or network communication - direct function calls.
 */
export interface ProgrammaticRun extends AsyncIterableIterator<AgentEvent> {
  send?(text: string): Promise<void>;
  respond?(interactionId: string, response: InteractionResponse): Promise<void>;
  interrupt?(): Promise<void>;
  close?(): Promise<void> | void;
}

export interface ProgrammaticAdapter extends LegacyAgentAdapter {
  readonly adapterType: 'programmatic';

  execute(options: RunOptions): ProgrammaticRun;
}

// ---------------------------------------------------------------------------
// Server Management
// ---------------------------------------------------------------------------

/**
 * Server configuration options for remote adapters.
 */
export interface ServerOptions {
  port?: number;
  host?: string;
  timeout?: number;
  env?: Record<string, string>;
  args?: string[];
}

/**
 * Information about a managed server instance.
 */
export interface ServerInfo {
  readonly serverId: string;
  readonly serverType: string;
  readonly endpoint: string;
  readonly pid?: number;
  readonly port: number;
  readonly startedAt: Date;
}

/**
 * Server health status.
 */
export interface ServerHealth {
  status: 'starting' | 'healthy' | 'unhealthy' | 'stopped';
  uptime?: number;
  lastCheck: Date;
  details?: string;
}

/**
 * Server lifecycle manager interface.
 */
export interface ServerManager {
  start(adapter: RemoteAdapter, options?: ServerOptions): Promise<ServerInfo>;
  stop(serverId: string): Promise<void>;
  health(serverId: string): Promise<ServerHealth>;
  list(): Promise<ServerInfo[]>;
  cleanup(): Promise<void>; // Clean up stopped servers
}

// ---------------------------------------------------------------------------
// Union Type
// ---------------------------------------------------------------------------

/**
 * Union of all adapter types. This replaces the original AgentAdapter interface
 * while maintaining backward compatibility.
 */
export type AgentAdapter = SubprocessAdapter | RemoteAdapter | ProgrammaticAdapter;

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

export function isSubprocessAdapter(adapter: AgentAdapter): adapter is SubprocessAdapter {
  return adapter.adapterType === 'subprocess';
}

export function isRemoteAdapter(adapter: AgentAdapter): adapter is RemoteAdapter {
  return adapter.adapterType === 'remote';
}

export function isProgrammaticAdapter(adapter: AgentAdapter): adapter is ProgrammaticAdapter {
  return adapter.adapterType === 'programmatic';
}

export function isHttpConnection(connection: RemoteConnection): connection is HttpConnection {
  return connection.connectionType === 'http';
}

export function isWebSocketConnection(connection: RemoteConnection): connection is WebSocketConnection {
  return connection.connectionType === 'websocket';
}
