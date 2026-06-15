/**
 * Maps adapters AgentEvent instances to agent-platform internal events.
 *
 * agent-platform consumes these mapped events for:
 *   - Session history recording
 *   - Cost journaling
 *   - Governance checks
 *   - Webhook forwarding
 *   - Stop-hook orchestration loop
 *
 * @module harnes./adapters/adapterEventMapper
 */

import type { AdapterAgentEvent } from "./adapterTypes";

// ---------------------------------------------------------------------------
// Babysitter internal event type
// ---------------------------------------------------------------------------

/**
 * Internal event representation used within agent-platform.
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
  /** adapters run ID. */
  runId: string;
  /** Payload varies by kind. */
  data: Record<string, unknown>;
}

/**
 * Known babysitter event kinds derived from adapters event types.
 *
 * The const array is the single source of truth -- the type union and
 * runtime Set are both derived from it so they can never drift apart.
 */
const BABYSITTER_EVENT_KINDS = [
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
  "unknown",
] as const;

export type BabysitterEventKind = (typeof BABYSITTER_EVENT_KINDS)[number];

// ---------------------------------------------------------------------------
// Well-known event type set (derived from the const array above)
// ---------------------------------------------------------------------------

const KNOWN_EVENT_TYPES: ReadonlySet<string> = new Set(
  BABYSITTER_EVENT_KINDS.filter((k) => k !== "unknown"),
);

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

/**
 * Map an adapters AgentEvent to a agent-platform internal event.
 *
 * Returns `null` for event types agent-platform doesn't care about
 * (e.g. internal debug events from adapters). Unknown but non-null
 * events are mapped with kind "unknown" so downstream consumers can
 * log or ignore them.
 *
 * @param event - The raw adapters event.
 * @returns The mapped BabysitterEvent, or null to drop.
 */
export function mapAmuxEvent(event: AdapterAgentEvent): BabysitterEvent | null {
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
