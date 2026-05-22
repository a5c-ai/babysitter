/**
 * Maps agent-mux AgentEvent instances to babysitter-agent internal events.
 *
 * babysitter-agent consumes these mapped events for:
 *   - Session history recording
 *   - Cost journaling
 *   - Governance checks
 *   - Webhook forwarding
 *   - Stop-hook orchestration loop
 *
 * @module harness/amux/amuxEventMapper
 */

import type { AmuxAgentEvent } from "./amuxTypes";

// ---------------------------------------------------------------------------
// Babysitter internal event type
// ---------------------------------------------------------------------------

/**
 * Internal event representation used within babysitter-agent.
 *
 * This is intentionally a simple tagged union so downstream consumers
 * (session history, cost journal, webhooks) can switch on `kind`.
 */
export interface BabysitterEvent {
  /** Discriminator. */
  kind: BabysitterEventKind;
  /** ISO-8601 timestamp from the source event. */
  timestamp: string;
  /** Agent/adapter that produced the event. */
  agent: string;
  /** agent-mux run ID. */
  runId: string;
  /** Payload varies by kind. */
  data: Record<string, unknown>;
}

/**
 * Known babysitter event kinds derived from agent-mux event types.
 */
export type BabysitterEventKind =
  | "session_start"
  | "session_end"
  | "text_delta"
  | "thinking_delta"
  | "tool_call_start"
  | "tool_result"
  | "cost"
  | "token_usage"
  | "approval_request"
  | "input_required"
  | "error"
  | "crash"
  | "context_compacted"
  | "unknown";

// ---------------------------------------------------------------------------
// Well-known event type set
// ---------------------------------------------------------------------------

const KNOWN_EVENT_TYPES = new Set<string>([
  "session_start",
  "session_end",
  "text_delta",
  "thinking_delta",
  "tool_call_start",
  "tool_result",
  "cost",
  "token_usage",
  "approval_request",
  "input_required",
  "error",
  "crash",
  "context_compacted",
]);

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

/**
 * Map an agent-mux AgentEvent to a babysitter-agent internal event.
 *
 * Returns `null` for event types babysitter-agent doesn't care about
 * (e.g. internal debug events from agent-mux). Unknown but non-null
 * events are mapped with kind "unknown" so downstream consumers can
 * log or ignore them.
 *
 * @param event - The raw agent-mux event.
 * @returns The mapped BabysitterEvent, or null to drop.
 */
export function mapAmuxEvent(event: AmuxAgentEvent): BabysitterEvent | null {
  if (!event || !event.type) {
    return null;
  }

  // Extract the base fields every BabysitterEvent needs.
  const { type, runId, agent, timestamp, ...rest } = event;

  const kind: BabysitterEventKind = KNOWN_EVENT_TYPES.has(type)
    ? (type as BabysitterEventKind)
    : "unknown";

  return {
    kind,
    timestamp: timestamp ?? new Date().toISOString(),
    agent: agent ?? "unknown",
    runId: runId ?? "",
    data: { originalType: type, ...rest },
  };
}

// ---------------------------------------------------------------------------
// Convenience predicates
// ---------------------------------------------------------------------------

/** Returns true if the event represents a governance-relevant tool call. */
export function isToolEvent(event: BabysitterEvent): boolean {
  return event.kind === "tool_call_start" || event.kind === "tool_result";
}

/** Returns true if the event carries cost/token information. */
export function isCostEvent(event: BabysitterEvent): boolean {
  return event.kind === "cost" || event.kind === "token_usage";
}

/** Returns true if the event requires an interactive response. */
export function isInteractiveEvent(event: BabysitterEvent): boolean {
  return event.kind === "approval_request" || event.kind === "input_required";
}

/** Returns true if the event signals an error condition. */
export function isErrorEvent(event: BabysitterEvent): boolean {
  return event.kind === "error" || event.kind === "crash";
}

/** Returns true if the event represents a session lifecycle boundary. */
export function isSessionLifecycleEvent(event: BabysitterEvent): boolean {
  return event.kind === "session_start" || event.kind === "session_end";
}
