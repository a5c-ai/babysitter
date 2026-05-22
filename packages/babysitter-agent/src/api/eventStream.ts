/**
 * GAP-JSON-005: Event Stream API — subscription management.
 *
 * High-level API for subscribing to journal event streams.
 * Wraps JournalWatcher with subscription tracking and ApiResult envelopes.
 */

import * as crypto from "node:crypto";
import { resolveExistingRunDir, resolveRunsDir } from "@a5c-ai/babysitter-sdk";
import { createJournalWatcher, type JournalWatcher } from "../storage/journalWatcher";
import { ok, fail, pathExists } from "./utils";
import type { ApiResult } from "./runs";
import type { JournalEvent } from "../storage/types";

// ── Types ──────────────────────────────────────────────────────────────────

export interface SubscribeRunEventsInput {
  runId: string;
  runsDir?: string;
  afterSeq?: number;
  pollIntervalMs?: number;
  onEvent: (event: JournalEvent) => void;
  onError?: (error: Error) => void;
  onDone?: () => void;
}

export interface SubscribeRunEventsOutput {
  subscriptionId: string;
  lastSeq: number;
}

export interface UnsubscribeRunEventsOutput {
  lastSeq: number;
}

// ── Subscription registry ─────────────────────────────────────────────────

interface SubscriptionEntry {
  runId: string;
  watcher: JournalWatcher;
}

const subscriptions = new Map<string, SubscriptionEntry>();

// ── API functions ─────────────────────────────────────────────────────────

export async function apiSubscribeRunEvents(
  input: SubscribeRunEventsInput,
): Promise<ApiResult<SubscribeRunEventsOutput>> {
  try {
    if (!input.runId) {
      return fail("INVALID_INPUT", "runId must be a non-empty string");
    }
    if (typeof input.runsDir === "string" && input.runsDir.trim().length === 0) {
      return fail("INVALID_INPUT", "runsDir must be a non-empty string");
    }
    const runDir = resolveExistingRunDir(input.runId, { override: input.runsDir ?? resolveRunsDir() });
    if (!(await pathExists(runDir))) {
      return fail("RUN_NOT_FOUND", `Run not found: ${input.runId}`);
    }

    const subscriptionId = crypto.randomUUID();

    const watcher = createJournalWatcher({
      runDir,
      afterSeq: input.afterSeq,
      pollIntervalMs: input.pollIntervalMs,
      onEvent: input.onEvent,
      onError: input.onError,
      onDone: () => {
        // Clean up subscription Map when watcher auto-closes on terminal events
        subscriptions.delete(subscriptionId);
        if (input.onDone) input.onDone();
      },
    });

    subscriptions.set(subscriptionId, {
      runId: input.runId,
      watcher,
    });

    return ok({
      subscriptionId,
      lastSeq: watcher.lastSeenSeq,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return fail("INTERNAL_ERROR", msg);
  }
}

export function apiUnsubscribeRunEvents(
  input: { subscriptionId: string },
): ApiResult<UnsubscribeRunEventsOutput> {
  try {
    if (!input.subscriptionId) {
      return fail("INVALID_INPUT", "subscriptionId must be a non-empty string");
    }

    const entry = subscriptions.get(input.subscriptionId);
    if (!entry) {
      return fail("SUBSCRIPTION_NOT_FOUND", `Subscription not found: ${input.subscriptionId}`);
    }

    const lastSeq = entry.watcher.lastSeenSeq;
    entry.watcher.close();
    subscriptions.delete(input.subscriptionId);

    return ok({ lastSeq });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return fail("INTERNAL_ERROR", msg);
  }
}

export function getActiveSubscriptions(): Map<string, { runId: string; lastSeq: number }> {
  const result = new Map<string, { runId: string; lastSeq: number }>();
  for (const [id, entry] of subscriptions) {
    result.set(id, {
      runId: entry.runId,
      lastSeq: entry.watcher.lastSeenSeq,
    });
  }
  return result;
}

export function closeAllSubscriptions(): void {
  for (const [id, entry] of subscriptions) {
    entry.watcher.close();
    subscriptions.delete(id);
  }
}
