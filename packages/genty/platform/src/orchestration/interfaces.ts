/**
 * Orchestration provider abstraction interfaces.
 *
 * These interfaces define the contract between genty and any orchestration
 * backend. Babysitter-SDK is one implementation; other systems (custom
 * runners, cloud orchestrators, test stubs) can provide their own.
 *
 * No babysitter-sdk imports should appear in this file.
 */

// ── Run Lifecycle ───────────────────────────────────────────────────────

/** Possible states of a run. */
export type RunStatus = "pending" | "running" | "waiting" | "completed" | "failed";

/** Opaque handle to an active run. */
export interface RunHandle {
  runId: string;
  runDir: string;
  processId: string;
  status: RunStatus;
}

// ── Effects ─────────────────────────────────────────────────────────────

/** Types of effects an orchestration loop can emit. */
export type EffectKind = "agent" | "skill" | "shell" | "breakpoint" | "sleep";

/** An effect waiting to be resolved. */
export interface PendingEffect {
  effectId: string;
  kind: EffectKind;
  label: string;
  status: string;
  taskDef: unknown;
}

/** Result of an effect execution. */
export interface EffectResult {
  status: "ok" | "error";
  value?: unknown;
  error?: unknown;
  startedAt?: string;
  finishedAt?: string;
}

// ── Iteration ───────────────────────────────────────────────────────────

/** Result of a single orchestration iteration. */
export interface IterationResult {
  iteration: number;
  status: "executed" | "waiting" | "completed" | "failed" | "none";
  action: string;
  reason: string;
  pendingEffects: PendingEffect[];
  completionProof?: string;
}

// ── Journal ─────────────────────────────────────────────────────────────

/** A journal event persisted during a run. */
export interface RunEvent {
  type: string;
  timestamp: string;
  data?: unknown;
}

// ── Run Creation ────────────────────────────────────────────────────────

/** Options for creating a new run. */
export interface CreateRunOptions {
  processId: string;
  entrypoint: string;
  prompt: string;
  harness?: string;
  inputs?: Record<string, unknown>;
  runsDir?: string;
  nonInteractive?: boolean;
}

// ── Orchestration Provider ──────────────────────────────────────────────

/**
 * The main plugin contract for an orchestration backend.
 *
 * Implementations translate between genty's framework-agnostic model and
 * the concrete run mechanics of a particular orchestration system.
 */
export interface OrchestrationProvider {
  readonly name: string;

  /** Create a new run and return a handle to it. */
  createRun(opts: CreateRunOptions): Promise<RunHandle>;

  /** Advance the run by one iteration. */
  iterateRun(handle: RunHandle, iteration?: number): Promise<IterationResult>;

  /** Post the result of an effect back to the orchestration system. */
  postEffectResult(handle: RunHandle, effectId: string, result: EffectResult): Promise<void>;

  /** Refresh and return the current status of a run. */
  getRunStatus(handle: RunHandle): Promise<RunHandle>;

  /** Load journal events for a run. */
  getRunEvents(handle: RunHandle, opts?: { limit?: number; reverse?: boolean }): Promise<RunEvent[]>;

  /** List effects that are waiting for resolution. */
  getPendingEffects(handle: RunHandle): Promise<PendingEffect[]>;

  /** Resolve the default runs directory for this provider. */
  resolveRunsDir(opts?: { cwd?: string }): string;
}

// ── Governance ──────────────────────────────────────────────────────────

/** Approval stance a governance provider can take. */
export type ApprovalPosture = "ask" | "auto-approve" | "deny";

/** Decision returned by governance when evaluating a breakpoint. */
export interface BreakpointDecision {
  autoApprove: boolean;
  reason?: string;
}

/** Governance evaluation provider. */
export interface GovernanceProvider {
  evaluateBreakpoint(
    effect: PendingEffect,
    context: Record<string, unknown>,
  ): Promise<BreakpointDecision>;
  getApprovalPosture(): ApprovalPosture;
}

// ── Journal Provider ────────────────────────────────────────────────────

/** Abstraction over event journal storage. */
export interface JournalProvider {
  loadEvents(runDir: string): Promise<RunEvent[]>;
  appendEvent(runDir: string, event: RunEvent): Promise<void>;
}

// ── Process Definition ──────────────────────────────────────────────────

/** Result of validating a process definition. */
export interface ProcessValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** Provider that can load and validate process definitions. */
export interface ProcessDefinitionProvider {
  validateProcess(path: string): Promise<ProcessValidationResult>;
  loadProcess(path: string): Promise<{ entrypoint: string; exportName: string }>;
}

// ── External Agents ─────────────────────────────────────────────────────

/** Metadata for a discovered external agent. */
export interface AgentInfo {
  name: string;
  path: string;
  description?: string;
}

/** Provider that discovers agents available in a workspace. */
export interface ExternalAgentProvider {
  discoverAgents(workspace: string): Promise<AgentInfo[]>;
}

// ── Session ─────────────────────────────────────────────────────────────

/** Provider for session identity and binding. */
export interface SessionProvider {
  resolveSessionId(): string | undefined;
  bindSession(runId: string, sessionId: string): Promise<void>;
}
