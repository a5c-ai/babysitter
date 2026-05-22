/**
 * Read agent-mux interaction responses from stdin.
 *
 * When babysitter-agent runs under agent-mux with `--output-format amux-events`,
 * the mux adapter may write JSONL interaction events to stdin (e.g.
 * `approval_response`, `input_response`). This module provides an
 * async-iterable reader that parses those events.
 *
 * @module harness/amux/amuxStdinReader
 */

import * as readline from "node:readline";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * An interaction event received on stdin from agent-mux.
 *
 * Known types:
 *   - `approval_response` -- response to an `approval_request` event
 *   - `input_response`    -- response to an `input_required` event
 */
export interface AmuxInteractionEvent {
  /** Event type discriminator. */
  type: string;
  /** Interaction ID this response corresponds to. */
  id: string;
  /** The response payload (varies by type). */
  response: unknown;
  /** Whether the action was approved (for approval_response). */
  approved?: boolean;
}

// ---------------------------------------------------------------------------
// Reader implementation
// ---------------------------------------------------------------------------

/**
 * Create an async-iterable that yields interaction events parsed from stdin.
 *
 * Each line on stdin is expected to be a JSON object with at least a `type`
 * and `id` field. Non-JSON lines and parse errors are silently ignored (they
 * may be noise from the host terminal).
 *
 * The iterable ends when stdin is closed (EOF).
 */
export function createAmuxStdinReader(): AsyncIterable<AmuxInteractionEvent> {
  const rl = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
  });

  // Build an AsyncGenerator so callers can `for await ... of` the stream.
  async function* generate(): AsyncGenerator<AmuxInteractionEvent> {
    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(trimmed) as Record<string, unknown>;
      } catch {
        // Not JSON -- skip
        continue;
      }

      if (typeof parsed["type"] !== "string" || typeof parsed["id"] !== "string") {
        continue;
      }

      yield {
        type: parsed["type"],
        id: parsed["id"],
        response: parsed["response"],
        approved: typeof parsed["approved"] === "boolean" ? parsed["approved"] : undefined,
      };
    }
  }

  return generate();
}

/**
 * Wait for a single interaction response matching `interactionId`.
 *
 * Consumes events from the reader until a matching response is found or
 * the stream ends. Returns `null` if the stream ends without a match.
 */
export async function waitForInteractionResponse(
  reader: AsyncIterable<AmuxInteractionEvent>,
  interactionId: string,
): Promise<AmuxInteractionEvent | null> {
  for await (const event of reader) {
    if (event.id === interactionId) {
      return event;
    }
  }
  return null;
}
