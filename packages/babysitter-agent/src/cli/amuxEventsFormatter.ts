/**
 * Formats babysitter-agent invocation results as agent-mux compatible
 * JSONL events.
 *
 * When `--output-format amux-events` is used, the `invoke` command
 * outputs one JSON object per line to stdout so agent-mux's babysitter
 * adapter can parse our output as a normalised event stream.
 *
 * @module cli/amuxEventsFormatter
 */

import type { HarnessInvokeResult } from "../harness/types";
import { mapHarnessToAmuxAdapter, hasAmuxAdapter } from "../harness/amux/amuxHarnessMap";

/**
 * Shape of a single JSONL event line emitted in amux-events format.
 * Matches the AmuxAgentEvent interface so agent-mux can consume it.
 */
interface AmuxJsonlEvent {
  type: string;
  runId: string;
  agent: string;
  timestamp: string;
  [key: string]: unknown;
}

/**
 * Convert a HarnessInvokeResult into an array of JSONL strings
 * representing agent-mux compatible events.
 *
 * Events emitted:
 *   1. `session_start` -- marks the beginning of the invocation
 *   2. `text_delta` -- the full output text (one event)
 *   3. `cost` -- duration metadata
 *   4. `session_end` -- marks the end, carries exit code and success flag
 *
 * If the result contains an error (exitCode !== 0), an `error` event is
 * emitted before `session_end`.
 */
export function formatResultAsAmuxEvents(
  harness: string,
  result: HarnessInvokeResult,
): string[] {
  const agent = hasAmuxAdapter(harness)
    ? mapHarnessToAmuxAdapter(harness)
    : harness;
  const runId = `babysitter-${Date.now()}`;
  const now = new Date().toISOString();
  const lines: string[] = [];

  const emit = (event: AmuxJsonlEvent): void => {
    lines.push(JSON.stringify(event));
  };

  // 1. Session start
  emit({
    type: "session_start",
    runId,
    agent,
    timestamp: now,
    harness,
  });

  // 2. Full text output as a single text_delta
  if (result.output) {
    emit({
      type: "text_delta",
      runId,
      agent,
      timestamp: now,
      text: result.output,
    });
  }

  // 3. Cost / duration
  emit({
    type: "cost",
    runId,
    agent,
    timestamp: now,
    durationMs: result.duration,
  });

  // 4. Error (if any)
  if (!result.success) {
    emit({
      type: "error",
      runId,
      agent,
      timestamp: now,
      exitCode: result.exitCode,
      message: result.output,
    });
  }

  // 5. Session end
  emit({
    type: "session_end",
    runId,
    agent,
    timestamp: now,
    exitCode: result.exitCode,
    success: result.success,
    durationMs: result.duration,
  });

  return lines;
}
