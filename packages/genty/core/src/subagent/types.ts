/**
 * Subagent invocation interfaces for the L4 Agent-Core layer.
 *
 * Defines how a parent agent creates, invokes, and manages child agents
 * through different invocation modes: as a tool call, via delegation
 * with oversight, or through a full handoff of control.
 */

// ---------------------------------------------------------------------------
// Invocation Modes
// ---------------------------------------------------------------------------

/** Discriminator for how a subagent is invoked. */
export type InvocationMode = 'as-tool-call' | 'delegation' | 'handoff';

// ---------------------------------------------------------------------------
// Subagent Descriptor
// ---------------------------------------------------------------------------

/** Describes a subagent that can be invoked by a parent agent. */
export interface SubagentDescriptor {
  /** Unique identifier for this subagent. */
  readonly id: string;

  /** Human-readable name. */
  readonly name: string;

  /** Short description of the subagent's capabilities. */
  readonly description: string;

  /**
   * System prompt injected when the subagent is instantiated.
   * When `undefined`, the subagent uses its own default prompt.
   */
  readonly systemPrompt?: string;

  /** Model override for this subagent (defaults to the parent's model). */
  readonly model?: string;

  /**
   * Tool names this subagent is allowed to use.
   * When `undefined`, the subagent inherits the parent's tool surface.
   */
  readonly allowedTools?: readonly string[];

  /** Maximum turns the subagent may take before being force-terminated. */
  readonly maxTurns?: number;
}

// ---------------------------------------------------------------------------
// Oversight Configuration
// ---------------------------------------------------------------------------

/**
 * Controls how the parent agent reviews and approves subagent results
 * before they are incorporated into the parent's context.
 */
export interface OversightConfig {
  /** When `true`, the parent reviews the result before accepting it. */
  readonly requireApproval: boolean;

  /**
   * Maximum time in milliseconds the parent will wait for the subagent
   * to complete before timing out. `undefined` means no timeout.
   */
  readonly timeoutMs?: number;

  /**
   * Number of additional review attempts after the first rejection.
   * Defaults to 0 for one review pass.
   */
  readonly maxReviewRetries?: number;

  /**
   * When `true`, the parent can see the subagent's intermediate tool
   * calls and reasoning, not just the final result.
   */
  readonly transparentExecution?: boolean;
}

// ---------------------------------------------------------------------------
// Subagent Result
// ---------------------------------------------------------------------------

/** The result returned from a subagent invocation. */
export interface SubagentResult<TOutput = unknown> {
  /** The subagent that produced this result. */
  readonly agentId: string;

  /** The invocation mode that was used. */
  readonly mode: InvocationMode;

  /** The output payload. */
  readonly output: TOutput;

  /** Whether the subagent completed successfully. */
  readonly success: boolean;

  /** Error message if the invocation failed. */
  readonly error?: string;

  /** Wall-clock duration in milliseconds. */
  readonly durationMs: number;

  /** Number of turns the subagent consumed. */
  readonly turnsUsed: number;

  /** Token usage across all turns. */
  readonly tokenUsage?: {
    readonly inputTokens: number;
    readonly outputTokens: number;
  };

  /**
   * When the invocation mode is `handoff`, the ID of the agent that
   * should resume control. `undefined` means control returns to the parent.
   */
  readonly handoffTarget?: string;
}

// ---------------------------------------------------------------------------
// Invocation Options
// ---------------------------------------------------------------------------

/** Options passed when invoking a subagent. */
export interface SubagentInvocationOptions {
  /** Oversight configuration for delegation mode. */
  readonly oversight?: OversightConfig;

  /**
   * Context entries shared from the parent to the subagent.
   * These are prepended to the subagent's conversation.
   */
  readonly sharedContext?: ReadonlyArray<{
    readonly role: 'system' | 'user' | 'assistant';
    readonly content: string;
  }>;

  /**
   * When `true`, the parent's full conversation history is forwarded
   * to the subagent. Use sparingly to avoid context bloat.
   */
  readonly inheritConversation?: boolean;
}

// ---------------------------------------------------------------------------
// SubagentInvoker Interface
// ---------------------------------------------------------------------------

/**
 * Core abstraction for subagent invocation in the L4 agent layer.
 *
 * Provides three invocation patterns:
 * - **invoke**: fire-and-collect as a tool call (agent-as-tool)
 * - **delegate**: the parent dispatches a task and reviews the result
 * - **handoff**: the parent transfers full control to the subagent
 */
export interface SubagentInvoker<TOutput = unknown> {
  /**
   * Invoke a subagent as a tool call. The parent blocks until the
   * subagent returns a result, which is injected as a tool response.
   *
   * @param descriptor - The subagent to invoke.
   * @param input - The prompt or task to send to the subagent.
   * @param options - Optional invocation configuration.
   */
  invoke(
    descriptor: SubagentDescriptor,
    input: string,
    options?: SubagentInvocationOptions,
  ): Promise<SubagentResult<TOutput>>;

  /**
   * Delegate a task to a subagent with oversight. The parent may review
   * intermediate progress and must approve the final result before it
   * is accepted.
   *
   * @param descriptor - The subagent to delegate to.
   * @param input - The task description.
   * @param options - Must include `oversight` configuration.
   */
  delegate(
    descriptor: SubagentDescriptor,
    input: string,
    options: SubagentInvocationOptions & { readonly oversight: OversightConfig },
  ): Promise<SubagentResult<TOutput>>;

  /**
   * Hand off control entirely to another agent. The current agent's
   * loop terminates and the target agent takes over the conversation.
   *
   * @param descriptor - The agent to hand off to.
   * @param input - Context or instructions for the handoff.
   * @param options - Optional shared context for the handoff.
   */
  handoff(
    descriptor: SubagentDescriptor,
    input: string,
    options?: SubagentInvocationOptions,
  ): Promise<SubagentResult<TOutput>>;
}
