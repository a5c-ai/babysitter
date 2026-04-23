/**
 * agent-mux integration bridge for babysitter-agent.
 *
 * Replaces the direct child-process invocation in `invoker.ts` for
 * external harnesses by delegating to an AmuxClient instance. The
 * client is injected so babysitter-agent never imports @agent-mux/core
 * directly -- it only depends on the interfaces defined in amuxTypes.ts.
 *
 * @module harness/amux/amuxBridge
 */

import type { HarnessInvokeOptions, HarnessInvokeResult } from "../types";
import type {
  AmuxClient,
  AmuxRunHandle,
} from "./amuxTypes";
import { mapHarnessToAmuxAdapter } from "./amuxHarnessMap";
import {
  mapAmuxEvent,
  isCostEvent,
  isErrorEvent,
  type BabysitterEvent,
} from "./amuxEventMapper";

// ---------------------------------------------------------------------------
// Bridge options
// ---------------------------------------------------------------------------

/**
 * Options that extend the standard HarnessInvokeOptions with fields
 * specific to the agent-mux bridge.
 */
export interface AmuxBridgeOptions extends HarnessInvokeOptions {
  /** Session ID for session resumption via agent-mux. */
  sessionId?: string;
  /** Whether to suppress interactive prompts (yolo mode). */
  nonInteractive?: boolean;
  /** Maximum agent turns before force-stop. */
  maxTurns?: number;
  /** Hook configuration forwarded to the agent. */
  hooks?: unknown;
  /** Skills to enable for this run. */
  skills?: string[];
}

/**
 * Extended result that includes agent-mux-specific metadata on top of
 * the standard HarnessInvokeResult.
 */
export interface AmuxBridgeResult extends HarnessInvokeResult {
  /** Session ID returned by agent-mux (for session resumption). */
  sessionId?: string;
  /** Accumulated cost from cost events. */
  totalCost: number;
  /** All babysitter-mapped events collected during the run. */
  events: BabysitterEvent[];
  /** The last assistant text message accumulated from text_delta events. */
  lastMessage: string;
}

// ---------------------------------------------------------------------------
// Event callback
// ---------------------------------------------------------------------------

/**
 * Optional callback invoked for each mapped babysitter event during
 * stream consumption. Useful for live governance checks, cost tracking,
 * and webhook forwarding without waiting for the full run to complete.
 */
export type AmuxEventCallback = (event: BabysitterEvent) => void | Promise<void>;

// ---------------------------------------------------------------------------
// Bridge implementation
// ---------------------------------------------------------------------------

/**
 * Invoke a harness through agent-mux instead of spawning the CLI directly.
 *
 * The function:
 *   1. Maps the babysitter harness name to an agent-mux adapter name.
 *   2. Calls `client.run()` with the translated options.
 *   3. Consumes the async event stream, mapping each AgentEvent to a
 *      BabysitterEvent.
 *   4. Accumulates text deltas, cost totals, and error state.
 *   5. Returns an AmuxBridgeResult compatible with HarnessInvokeResult.
 *
 * @param client      - AmuxClient instance (injected, no hard dep on @agent-mux/core).
 * @param harness     - babysitter harness name (e.g. "claude-code", "codex").
 * @param options     - Invocation options.
 * @param onEvent     - Optional per-event callback for live processing.
 * @returns Promise resolving to the bridge result.
 *
 * @throws {Error} if `harness` is "pi" / "internal" (use agent-core).
 * @throws {Error} if the harness has no agent-mux adapter mapping.
 */
export async function invokeViaAgentMux(
  client: AmuxClient,
  harness: string,
  options: AmuxBridgeOptions,
  onEvent?: AmuxEventCallback,
): Promise<AmuxBridgeResult> {
  const adapterName = mapHarnessToAmuxAdapter(harness);
  const startTime = Date.now();

  const handle: AmuxRunHandle = client.run({
    agent: adapterName,
    prompt: options.prompt,
    model: options.model,
    cwd: options.workspace,
    timeout: options.timeout,
    sessionId: options.sessionId,
    approvalMode: options.nonInteractive ? "yolo" : "prompt",
    stream: true,
    nonInteractive: options.nonInteractive,
    maxTurns: options.maxTurns,
    env: {
      ...(options.sessionId ? { AGENT_SESSION_ID: options.sessionId } : {}),
      ...options.env,
    },
    hooks: options.hooks,
    skills: options.skills,
  });

  // Wire AbortSignal to agent-mux handle
  if (options.signal) {
    if (options.signal.aborted) {
      handle.abort();
    } else {
      options.signal.addEventListener("abort", () => handle.abort(), {
        once: true,
      });
    }
  }

  // Consume the event stream
  const collectedEvents: BabysitterEvent[] = [];
  let lastMessage = "";
  let totalCost = 0;
  let hasError = false;

  for await (const rawEvent of handle.events) {
    const mapped = mapAmuxEvent(rawEvent);
    if (!mapped) continue;

    collectedEvents.push(mapped);

    // Accumulate text deltas
    if (mapped.kind === "text_delta") {
      const text = mapped.data["text"];
      if (typeof text === "string") {
        lastMessage += text;
      }
    }

    // Accumulate cost
    if (isCostEvent(mapped)) {
      const eventCost = mapped.data["totalCost"];
      if (typeof eventCost === "number") {
        totalCost += eventCost;
      }
    }

    // Track errors
    if (isErrorEvent(mapped)) {
      hasError = true;
    }

    // Forward to caller's live callback
    if (onEvent) {
      await onEvent(mapped);
    }
  }

  const duration = Date.now() - startTime;
  const exitCode = handle.exitCode ?? (hasError ? 1 : 0);

  return {
    success: exitCode === 0 && !hasError,
    output: lastMessage.trim(),
    exitCode,
    duration,
    harness,
    sessionId: handle.sessionId,
    totalCost,
    events: collectedEvents,
    lastMessage: lastMessage.trim(),
  };
}
