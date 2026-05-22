/**
 * agent-mux type adapters for babysitter-agent.
 *
 * Keeps a structural compatibility layer for the subset of agent-mux surface
 * that babysitter-agent consumes, without requiring TypeScript to resolve the
 * full @a5c-ai/agent-mux package during babysitter-agent compilation.
 *
 * @module harness/amux/amuxTypes
 */

// ---------------------------------------------------------------------------
// Run options
// ---------------------------------------------------------------------------

/**
 * Options accepted by AmuxClient.run().
 */
export interface AmuxRunOptions {
  agent: string;
  prompt: string;
  model?: string;
  cwd?: string;
  sessionId?: string;
  timeout?: number;
  approvalMode?: string;
  stream?: boolean;
  nonInteractive?: boolean;
  maxTurns?: number;
  env?: Record<string, string>;
  skills?: string[];
  /** Hook configuration forwarded to the agent. */
  hooks?: unknown;
}

// ---------------------------------------------------------------------------
// Run handle (adapter — real RunHandle is thenable + AsyncIterable)
// ---------------------------------------------------------------------------

/**
 * Adapter interface for the RunHandle returned by AgentMuxClient.run().
 *
 * The real run handle is simultaneously an AsyncIterable<AgentEvent>,
 * an EventEmitter, and a thenable (Promise<RunResult>). babysitter-agent
 * only needs the event stream, session metadata, and abort control.
 */
export interface AmuxRunHandle {
  /** Async-iterable stream of normalised agent events. */
  events: AsyncIterable<AmuxAgentEvent>;
  /** Channel for responding to interactive requests (approvals, inputs). */
  interactions: AmuxInteractionChannel;
  /** Session ID allocated or resumed by agent-mux. */
  sessionId?: string;
  /** Process exit code (set after the event stream ends). */
  exitCode?: number;
  /** Abort the running agent process. */
  abort(): void;
}

// ---------------------------------------------------------------------------
// Agent event (normalised event from any adapter)
// ---------------------------------------------------------------------------

/**
 * Canonical agent event emitted by agent-mux adapters.
 *
 * The real type uses `timestamp: number` (Unix epoch ms); this adapter keeps
 * `string` (ISO-8601) for backward compat with babysitter event mappers. The
 * bridge and tests rely on structural compatibility only.
 */
export interface AmuxAgentEvent {
  /** Event type discriminator. */
  type: string;
  /** Run identifier assigned by agent-mux. */
  runId: string;
  /** Adapter/agent name that produced the event. */
  agent: string;
  /** ISO-8601 timestamp. */
  timestamp: string;
  /** Arbitrary additional fields (schema depends on `type`). */
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Interaction channel
// ---------------------------------------------------------------------------

/**
 * Channel for responding to interactive events during a run.
 *
 * Simplified from the real MuxInteractionChannel — babysitter-agent
 * only uses the basic respond-by-ID pattern.
 */
export interface AmuxInteractionChannel {
  /** Respond to an interactive request by its ID. */
  respond(id: string, response: unknown): Promise<void>;
}

// ---------------------------------------------------------------------------
// Client interface
// ---------------------------------------------------------------------------

/**
 * Programmatic client for invoking agents via agent-mux.
 *
 * This is the subset of the real client that babysitter-agent depends on.
 * The concrete agent-mux client has many more methods (adapters, models,
 * sessions, config, auth, profiles, plugins, detectHost).
 */
export interface AmuxClient {
  /** Start an agent run and return a handle for streaming events. */
  run(options: AmuxRunOptions): AmuxRunHandle;
}

// ---------------------------------------------------------------------------
// Adapter discovery (optional, for harness:discover integration)
// ---------------------------------------------------------------------------

/** Metadata about an agent-mux adapter. Re-uses canonical AdapterRegistry. */
export interface AmuxAdapterInfo {
  /** Adapter identifier (e.g. "claude", "codex"). */
  agent: string;
  /** Human-readable display name. */
  displayName: string;
}

/** Result of checking whether an adapter's CLI is installed. */
export interface AmuxAdapterInstallationCheck {
  /** Whether the CLI binary is found on PATH. */
  installed: boolean;
  /** Detected version, if available. */
  version?: string;
}

/** Result of checking adapter authentication state. */
export interface AmuxAuthCheck {
  /** Auth state discriminator. */
  state: "authenticated" | "unauthenticated" | "unknown";
}

/**
 * Extended client interface that exposes adapter discovery.
 *
 * Maps to the real client which has `.adapters` and `.auth`
 * sub-managers.
 */
export interface AmuxClientWithDiscovery extends AmuxClient {
  adapters: {
    list(): AmuxAdapterInfo[];
    detectInstallation(agent: string): Promise<AmuxAdapterInstallationCheck>;
  };
  auth: {
    check(agent: string): Promise<AmuxAuthCheck>;
  };
}
