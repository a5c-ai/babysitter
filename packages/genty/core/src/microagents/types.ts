/**
 * Core type definitions for the microagents subsystem.
 *
 * Microagents are isolated, single-purpose agents designed exclusively
 * as subagents with structured I/O that run as isolated subprocesses.
 * They are never used directly by humans — only invoked by parent agents.
 */

// ---------------------------------------------------------------------------
// JSON Schema (subset)
// ---------------------------------------------------------------------------

/** Minimal JSON Schema representation for input/output validation. */
export interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  enum?: unknown[];
  description?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Isolation Mode
// ---------------------------------------------------------------------------

/** How the microagent is isolated from its parent. */
export type IsolationMode = 'subprocess' | 'worker' | 'container';

// ---------------------------------------------------------------------------
// Microagent Manifest
// ---------------------------------------------------------------------------

/** Full descriptor for a registered microagent. */
export interface MicroagentManifest {
  /** Unique name used to invoke this microagent. */
  readonly name: string;

  /** Semver version string. */
  readonly version: string;

  /** Human-readable description of what this microagent does. */
  readonly description: string;

  /** JSON Schema describing the expected input payload. */
  readonly inputSchema: JSONSchema;

  /** JSON Schema describing the output payload on success. */
  readonly outputSchema: JSONSchema;

  /** Isolation strategy for execution. */
  readonly isolation: IsolationMode;

  /** Runtime configuration for the microagent subprocess. */
  readonly runtime: {
    /** Path to the Node.js entrypoint script. */
    readonly entrypoint: string;

    /** Skill names made available to the microagent. */
    readonly skills?: readonly string[];

    /** Tool names the microagent may use. */
    readonly tools?: readonly string[];

    /** Named scripts the microagent can invoke. */
    readonly scripts?: Readonly<Record<string, string>>;

    /** Babysitter process definitions bundled with the microagent. */
    readonly processes?: readonly string[];

    /** Model override (defaults to the orchestrator's model). */
    readonly model?: string;

    /** Maximum execution time in milliseconds. */
    readonly timeout?: number;

    /** Extra environment variables injected into the subprocess. */
    readonly env?: Readonly<Record<string, string>>;
  };

  /** Searchable tags for filtering. */
  readonly tags: readonly string[];

  /** Whether this microagent ships with genty core. */
  readonly builtIn: boolean;
}

// ---------------------------------------------------------------------------
// Invocation & Result
// ---------------------------------------------------------------------------

/** Describes a single invocation request for a microagent. */
export interface MicroagentInvocation {
  /** Name of the target microagent (must be registered). */
  readonly microagentName: string;

  /** The input payload (validated against the manifest's inputSchema). */
  readonly input: unknown;

  /** Optional correlation ID for tracing across parent/child boundaries. */
  readonly correlationId?: string;

  /** ID of the parent agent that triggered this invocation. */
  readonly parentAgentId?: string;

  /** Per-invocation timeout override in milliseconds. */
  readonly timeout?: number;
}

/** The structured result returned after a microagent execution. */
export interface MicroagentResult {
  /** The output payload (validated against the manifest's outputSchema). */
  readonly output: unknown;

  /** Exit code of the subprocess (0 = success). */
  readonly exitCode: number;

  /** Wall-clock duration in milliseconds. */
  readonly durationMs: number;

  /** Stderr lines captured during execution. */
  readonly logs?: readonly string[];

  /** Structured error, present when exitCode !== 0. */
  readonly error?: { readonly code: string; readonly message: string };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Result of validating a value against a JSON Schema. */
export interface ValidationResult {
  /** Whether the value passed validation. */
  readonly valid: boolean;

  /** Human-readable error descriptions (empty when valid). */
  readonly errors: readonly string[];
}
