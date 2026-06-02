/**
 * Types for the harness mock/simulator.
 *
 * A "harness" is a CLI tool (claude-code, codex, etc.) that agent-mux
 * invokes as a subprocess. This package simulates harness behavior for
 * testing without requiring the real CLI tools to be installed.
 */

import type { ErrorCode } from '@a5c-ai/agent-mux-comm';

// ---------------------------------------------------------------------------
// Harness identity
// ---------------------------------------------------------------------------

/** Supported harness types for mocking. */
export type HarnessType =
  | 'claude-code'
  | 'codex'
  | 'gemini'
  | 'amp'
  | 'copilot'
  | 'cursor'
  | 'droid'
  | 'opencode'
  | 'pi'
  | 'omp'
  | 'openclaw'
  | 'hermes'
  | 'qwen'
  | 'aider'
  | 'goose'
  | 'custom'
  // New adapter types
  | 'claude-agent-sdk'
  | 'codex-sdk'
  | 'codex-websocket'
  | 'pi-sdk'
  | 'opencode-http';

/** Adapter execution types supported by harness-mock. */
export type AdapterExecutionType = 'subprocess' | 'http' | 'websocket' | 'sdk';

// ---------------------------------------------------------------------------
// File operation simulation
// ---------------------------------------------------------------------------

/** A simulated file operation that the harness would perform. */
export interface FileOperation {
  /** Type of file operation. */
  type: 'create' | 'modify' | 'delete' | 'rename';

  /** Absolute path to the file. */
  path: string;

  /** New path (only for 'rename'). */
  newPath?: string;

  /** Content to write (for 'create' and 'modify'). */
  content?: string;

  /** Diff/patch content (for 'modify', alternative to full content). */
  patch?: string;
}

// ---------------------------------------------------------------------------
// Process behavior simulation
// ---------------------------------------------------------------------------

/** Simulated process exit behavior. */
export interface ProcessBehavior {
  /** Exit code. 0 = success. */
  exitCode: number;

  /** Delay in ms before the process "starts producing output". */
  startupDelayMs?: number;

  /** Delay in ms before the process exits after all output is sent. */
  shutdownDelayMs?: number;

  /** If set, the process will crash with this signal after the given delay. */
  crashAfterMs?: number;

  /** Signal to crash with (default: SIGTERM). */
  crashSignal?: string;

  /** Whether the process hangs indefinitely (for timeout testing). */
  hang?: boolean;
}

// ---------------------------------------------------------------------------
// Stdin/Stdout simulation
// ---------------------------------------------------------------------------

/** A single output chunk from the simulated harness. */
export interface OutputChunk {
  /** Which stream this goes to. */
  stream: 'stdout' | 'stderr';

  /** The data to emit. */
  data: string;

  /** Delay in ms before emitting this chunk (relative to previous chunk). */
  delayMs?: number;
}

/** An expected stdin prompt and the mock's response behavior. */
export interface InteractionResolution {
  /** Output to emit after the interaction resolves. */
  output?: OutputChunk[];

  /** Exit code to use after resolution. If omitted, resume the base scenario. */
  exitCode?: number;
}

export interface StdinInteraction {
  /** Pattern to match on stdout/stderr before this interaction fires. */
  triggerPattern: string | RegExp;

  /** Auto-response to feed into stdin when the prompt appears. */
  response: string;

  /** Delay before responding (ms). */
  delayMs?: number;

  /** Explicit allow matcher for manual stdin input. Defaults to /^y(es)?\\s*$/i. */
  allowPattern?: string | RegExp;

  /** Explicit deny matcher for manual stdin input. Defaults to /^n(o)?\\s*$/i. */
  denyPattern?: string | RegExp;

  /** How long to wait for approval input before timing out. */
  timeoutMs?: number;

  /** Output/exit behavior once the interaction is allowed. */
  onAllow?: InteractionResolution;

  /** Output/exit behavior once the interaction is denied. */
  onDeny?: InteractionResolution;

  /** Output/exit behavior once the interaction times out. */
  onTimeout?: InteractionResolution;
}

// ---------------------------------------------------------------------------
// Event simulation
// ---------------------------------------------------------------------------

/** A simulated agent event (matching the agent-mux event schema). */
export interface MockEvent {
  /** Event type matching the agent-mux event taxonomy. */
  type: string;

  /** Delay before emitting this event (ms, relative to previous). */
  delayMs?: number;

  /** Event payload. */
  data: Record<string, unknown>;
}

export interface RuntimeHookScenarioStep {
  /** Zero-based output chunk index intercepted by the runtime hook. */
  chunkIndex: number;

  /** Hook kind being simulated. */
  kind: 'preToolUse' | 'postToolUse' | 'sessionStart' | 'sessionEnd' | 'stop' | 'userPromptSubmit';

  /** Payload surfaced on the emitted runtime-hook event. */
  payload?: Record<string, unknown>;

  /** Mock runtime-hook decision. */
  decision: 'allow' | 'deny' | 'timeout';

  /** Delay before the decision resolves. */
  delayMs?: number;

  /** Optional stderr line when the hook denies the action. */
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// HTTP/WebSocket/SDK behavior simulation
// ---------------------------------------------------------------------------

/** Configuration for HTTP server mocking. */
export interface HttpServerConfig {
  /** Port to bind the mock server to. */
  port?: number;

  /** Host to bind to (default: localhost). */
  host?: string;

  /** Startup delay in milliseconds. */
  startupDelayMs?: number;

  /** Whether server startup should fail. */
  startupFails?: boolean;

  /** Routes and their response configurations. */
  routes?: Record<string, HttpRouteConfig>;

  /** Global response delay (applies to all routes). */
  globalDelayMs?: number;

  /** Enable CORS headers. */
  enableCors?: boolean;
}

/** Configuration for a single HTTP route. */
export interface HttpRouteConfig {
  /** HTTP method (GET, POST, etc.). */
  method?: string;

  /** Response status code. */
  status?: number;

  /** Response headers. */
  headers?: Record<string, string>;

  /** Response body (string, object, or function). */
  body?: string | object | ((req: unknown) => unknown);

  /** Response delay for this specific route. */
  delayMs?: number;

  /** Whether to stream the response. */
  streaming?: boolean;

  /** For streaming responses, chunks to send. */
  streamChunks?: Array<{ data: string; delayMs?: number }>;
}

/** Configuration for WebSocket server mocking. */
export interface WebSocketConfig {
  /** Port to bind the WebSocket server to. */
  port?: number;

  /** Host to bind to (default: localhost). */
  host?: string;

  /** Startup delay in milliseconds. */
  startupDelayMs?: number;

  /** Whether server startup should fail. */
  startupFails?: boolean;

  /** Channels to support. */
  channels?: string[];

  /** Ping interval in milliseconds. */
  pingIntervalMs?: number;

  /** Connection timeout in milliseconds. */
  connectionTimeoutMs?: number;

  /** Maximum number of concurrent connections. */
  maxConnections?: number;

  /** Whether to simulate connection drops. */
  simulateDrops?: {
    /** Drop connections after this many messages. */
    afterMessages?: number;
    /** Delay before reconnection is allowed. */
    reconnectDelayMs?: number;
  };
}

/** Configuration for SDK mocking. */
export interface SdkConfig {
  /** SDK name/identifier. */
  sdkName?: string;

  /** Version to simulate. */
  version?: string;

  /** Authentication configuration. */
  auth?: {
    /** Whether authentication should succeed. */
    succeeds: boolean;
    /** Delay for auth operations. */
    delayMs?: number;
    /** Required API keys or tokens. */
    requiredKeys?: string[];
  };

  /** API call simulation. */
  apiCalls?: Record<string, SdkMethodConfig>;

  /** Global settings for all SDK methods. */
  globalConfig?: {
    /** Default delay for all operations. */
    defaultDelayMs?: number;
    /** Rate limiting simulation. */
    rateLimitMs?: number;
    /** Network failure simulation rate (0-1). */
    failureRate?: number;
  };
}

/** Configuration for a single SDK method. */
export interface SdkMethodConfig {
  /** Response to return. */
  response?: unknown;

  /** Delay before response. */
  delayMs?: number;

  /** Whether this method should fail. */
  shouldFail?: boolean;

  /** Error to throw if shouldFail is true. */
  error?: {
    code: string;
    message: string;
  };

  /** Whether this method supports streaming. */
  streaming?: boolean;

  /** For streaming methods, events to emit. */
  streamEvents?: Array<{
    type: string;
    data: unknown;
    delayMs?: number;
  }>;
}

// ---------------------------------------------------------------------------
// Harness scenario
// ---------------------------------------------------------------------------

/**
 * A complete scenario describing how a mock harness should behave.
 * This is the primary configuration object for setting up mock tests.
 */
export interface HarnessScenario {
  /** Which harness to simulate. */
  harness: HarnessType;

  /** Human-readable scenario name (for test output). */
  name?: string;

  /** The execution type for this harness (default: subprocess). */
  executionType?: AdapterExecutionType;

  // ── Subprocess-specific configuration ──────────────────────────────

  /** Process behavior (exit code, timing, crashes). */
  process?: ProcessBehavior;

  /** Sequence of output chunks to emit. */
  output?: OutputChunk[];

  /** Interactive stdin/stdout exchanges. */
  interactions?: StdinInteraction[];

  /** Environment variables the harness expects. */
  expectedEnv?: Record<string, string>;

  /** Expected command-line arguments. */
  expectedArgs?: string[];

  /** Expected working directory. */
  expectedCwd?: string;

  // ── Common configuration ────────────────────────────────────────────

  /** Sequence of events the harness would produce. */
  events?: MockEvent[];

  /** File operations the harness would perform. */
  fileOperations?: FileOperation[];

  /** Simulated telemetry data. */
  telemetry?: {
    spans?: Array<{
      name: string;
      attributes?: Record<string, string | number | boolean>;
      status?: 'ok' | 'error';
      delayMs?: number;
    }>;
    metrics?: Array<{
      name: string;
      value: number;
      attributes?: Record<string, string | number | boolean>;
      delayMs?: number;
    }>;
  };

  /** Optional runtime-hook interception points for subprocess scenarios. */
  runtimeHooks?: {
    steps: RuntimeHookScenarioStep[];
  };

  // ── HTTP-specific configuration ─────────────────────────────────────

  /** HTTP server configuration (for HTTP adapters). */
  httpServer?: HttpServerConfig;

  // ── WebSocket-specific configuration ────────────────────────────────

  /** WebSocket server configuration (for WebSocket adapters). */
  websocketServer?: WebSocketConfig;

  // ── SDK-specific configuration ──────────────────────────────────────

  /** SDK configuration (for programmatic adapters). */
  sdk?: SdkConfig;
}

// ---------------------------------------------------------------------------
// Mock harness handle
// ---------------------------------------------------------------------------

/** Base handle to a running mock harness. */
export interface MockHarnessHandle {
  /** The scenario being executed. */
  readonly scenario: HarnessScenario;

  /** Unique identifier for this mock instance. */
  readonly id: number;

  /** Whether the mock has stopped. */
  readonly exited: boolean;

  /** Files that were "modified" by this mock. */
  readonly fileChanges: FileOperation[];

  /** Stop the mock (gracefully if possible). */
  stop(): Promise<void>;

  /** Force stop the mock immediately. */
  forceStop(): void;

  /** Wait for the mock to complete. */
  waitForCompletion(): Promise<MockExecutionResult>;
}

/** Result of mock execution. */
export interface MockExecutionResult {
  /** Whether execution completed successfully. */
  success: boolean;

  /** Duration of execution in milliseconds. */
  durationMs: number;

  /** Any error that occurred. */
  error?: {
    code: string;
    message: string;
  };

  /** Execution-type specific results. */
  results: SubprocessResult | HttpServerResult | WebSocketServerResult | SdkResult;
}

/** Subprocess-specific handle (traditional harness mock). */
export interface SubprocessMockHandle extends MockHarnessHandle {
  /** The exit code (undefined until exited). */
  readonly exitCode: number | undefined;

  /** All stdout data collected so far. */
  readonly stdout: string;

  /** All stderr data collected so far. */
  readonly stderr: string;

  /** Write to the mock's stdin. */
  write(data: string): void;

  /** Send a signal to the mock process. */
  kill(signal?: string): void;

  /** Wait for the mock process to exit. */
  waitForExit(): Promise<{ exitCode: number; stdout: string; stderr: string }>;
}

/** HTTP server-specific handle. */
export interface HttpServerMockHandle extends MockHarnessHandle {
  /** Server endpoint URL. */
  readonly serverUrl: string;

  /** Server port. */
  readonly port: number;

  /** Whether the server is running. */
  readonly isRunning: boolean;

  /** Request history. */
  readonly requestHistory: Array<{
    method: string;
    path: string;
    headers: Record<string, string>;
    body: unknown;
    timestamp: Date;
  }>;

  /** Get server status. */
  getStatus(): {
    isRunning: boolean;
    requestCount: number;
    uptime: number;
  };

  /** Reset request history and state. */
  reset(): void;
}

/** WebSocket server-specific handle. */
export interface WebSocketServerMockHandle extends MockHarnessHandle {
  /** Server endpoint URL. */
  readonly serverUrl: string;

  /** Server port. */
  readonly port: number;

  /** Whether the server is running. */
  readonly isRunning: boolean;

  /** Connected clients count. */
  readonly connectionCount: number;

  /** Message history for all connections. */
  readonly messageHistory: Array<{
    connectionId: string;
    direction: 'inbound' | 'outbound';
    message: unknown;
    timestamp: Date;
  }>;

  /** Send message to all connected clients. */
  broadcast(message: unknown): void;

  /** Send message to specific connection. */
  sendTo(connectionId: string, message: unknown): void;

  /** Simulate connection drop for a specific client. */
  dropConnection(connectionId: string): void;

  /** Get connection status. */
  getConnectionStatus(): Array<{
    connectionId: string;
    connectedAt: Date;
    messageCount: number;
  }>;
}

/** SDK-specific handle. */
export interface SdkMockHandle extends MockHarnessHandle {
  /** SDK instance name. */
  readonly sdkName: string;

  /** Method call history. */
  readonly methodHistory: Array<{
    method: string;
    args: unknown[];
    result: unknown;
    durationMs: number;
    timestamp: Date;
  }>;

  /** Whether authentication was successful. */
  readonly isAuthenticated: boolean;

  /** Simulate a method call. */
  callMethod(method: string, ...args: unknown[]): Promise<unknown>;

  /** Get method call statistics. */
  getStats(): {
    totalCalls: number;
    uniqueMethods: string[];
    averageDurationMs: number;
  };

  /** Reset method history and state. */
  reset(): void;
}

// ── Result types for different execution types ──────────────────────────

/** Subprocess execution result. */
export interface SubprocessResult {
  type: 'subprocess';
  exitCode: number;
  stdout: string;
  stderr: string;
  signalKilled?: string;
}

/** HTTP server execution result. */
export interface HttpServerResult {
  type: 'http';
  requestCount: number;
  requestHistory: Array<{ method: string; path: string; status: number }>;
  averageResponseTimeMs: number;
}

/** WebSocket server execution result. */
export interface WebSocketServerResult {
  type: 'websocket';
  connectionCount: number;
  messageCount: number;
  averageConnectionDurationMs: number;
}

/** SDK execution result. */
export interface SdkResult {
  type: 'sdk';
  methodCallCount: number;
  uniqueMethods: string[];
  averageMethodDurationMs: number;
  authenticationAttempts: number;
}

// ---------------------------------------------------------------------------
// Harness behavior profile
// ---------------------------------------------------------------------------

/**
 * A captured behavior profile from probing a real harness.
 * Used to compare mock fidelity against actual harness behavior.
 */
export interface HarnessBehaviorProfile {
  /** Harness type. */
  harness: HarnessType;

  /** Execution transport captured by the profile. */
  executionType: AdapterExecutionType;

  /** Version of the harness that was probed. */
  version: string;

  /** Timestamp of when the profile was captured. */
  capturedAt: string;

  /** Startup time in ms. */
  startupTimeMs: number;

  /** How the harness formats its output (jsonl, streaming text, etc). */
  outputFormat: string;

  /** Additional traits observed or expected for the output stream. */
  outputFormatTraits: string[];

  /** Whether the harness supports stdin interaction. */
  supportsStdin: boolean;

  /** Prompt/signal markers associated with stdin interaction. */
  stdinSignals: string[];

  /** File operation patterns observed. */
  fileOperationPatterns: string[];

  /** Exit code mapping: scenario → exit code. */
  exitCodes: Record<string, number>;

  /** Environment variables the harness reads. */
  environmentVariables: string[];

  /** CLI argument patterns. */
  cliPatterns: Record<string, string>;

  /** Where this probe is expected to run. */
  availability: 'ci' | 'ci-or-local' | 'local-manual' | 'offline-only';

  /** Free-form notes for drift reviewers. */
  probeNotes: string[];
}
