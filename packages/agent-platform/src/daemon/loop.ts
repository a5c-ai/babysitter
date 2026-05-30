/**
 * GAP-REMOTE-001: Daemon Loop — main event loop with concurrent run pool.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import type {
  DaemonConfig,
  TriggerAdmissionConfig,
  TriggerAdmissionResult,
  TriggerCallback,
  TriggerEvent,
} from "./types";
import {
  isAutomationTriggerEvent,
  isFileTriggerConfig,
  isTimerAutomationRule,
  isWebhookAutomationRule,
} from "./types";
import { createFileWatcher } from "./fileWatcher";
import { createWebhookListener } from "./webhookListener";
import { createTimerScheduler } from "./timerScheduler";
import { appendDaemonLog } from "./daemonLog";
import { DurableTriggerQueue, type DurableTriggerRecord } from "./durableQueue";
import type { DurableTriggerQueueOptions } from "./durableQueue";

export interface DaemonLoopOptions {
  onTrigger?: TriggerCallback;
  signal?: AbortSignal;
  logDir?: string;
  queue?: DurableTriggerQueueOptions;
}

export interface DaemonLoopStatus {
  activeRuns: number;
  pendingRuns: number;
  deadLetterRuns?: number;
  rejectedTriggers?: number;
  duplicateTriggers?: number;
  rateLimitedTriggers?: number;
  updatedAt: string;
}

export async function runDaemonLoop(
  config: DaemonConfig,
  options?: DaemonLoopOptions,
): Promise<void> {
  const maxConcurrent = config.maxConcurrentRuns ?? 4;
  const handles: Array<{ dispose?: () => void; close?: () => Promise<void> }> = [];
  const activeRuns = new Set<Promise<void>>();
  const queue: TriggerEvent[] = [];
  const admission = createAdmissionController(config.triggerAdmission);
  const retryTimers = new Set<NodeJS.Timeout>();
  const durableQueue = options?.logDir
    ? await DurableTriggerQueue.open(options.logDir, options.queue)
    : null;

  let statusWriteChain = Promise.resolve();
  function scheduleStatusWrite(): void {
    statusWriteChain = statusWriteChain.then(() => writeLoopStatus()).catch(() => {
      // Status persistence is best-effort and must not surface as an
      // unhandled rejection during trigger dispatch or shutdown races.
    });
  }

  function scheduleRetryDrain(delayMs: number): void {
    const timer = setTimeout(() => {
      retryTimers.delete(timer);
      void drainQueue();
    }, Math.max(0, delayMs));
    retryTimers.add(timer);
  }

  async function drainQueue(): Promise<void> {
    if (durableQueue) {
      while (activeRuns.size < maxConcurrent) {
        const [next] = await durableQueue.claimDue(1);
        if (!next) break;
        dispatchDurableTrigger(next);
      }
      scheduleStatusWrite();
      return;
    }

    while (queue.length > 0 && activeRuns.size < maxConcurrent) {
      const next = queue.shift()!;
      dispatchTrigger(next);
    }
    scheduleStatusWrite();
  }

  function dispatchTrigger(trigger: TriggerEvent): Promise<void> | void {
    if (options?.onTrigger) {
      return Promise.resolve(options.onTrigger(trigger)).then(() => {});
    }
  }

  function dispatchDurableTrigger(record: DurableTriggerRecord): void {
    const promise = Promise.resolve()
      .then(() => dispatchTrigger(record.trigger))
      .then(
        async () => {
          await durableQueue?.ack(record.id);
        },
        async (error) => {
          await durableQueue?.fail(record.id, error);
          await appendDaemonLog(options!.logDir!, {
            timestamp: new Date().toISOString(),
            event: "TRIGGER_FAILED",
            data: { eventId: record.id, error: error instanceof Error ? error.message : String(error) },
          }).catch(() => {});
          const snapshot = (await durableQueue?.snapshot()) ?? [];
          const failed = snapshot.find((event) => event.id === record.id && event.nextAttemptAt);
          if (failed?.nextAttemptAt) {
            scheduleRetryDrain(Date.parse(failed.nextAttemptAt) - Date.now());
          }
        },
      )
      .finally(() => {
        activeRuns.delete(promise);
        void drainQueue();
      });
    activeRuns.add(promise);
  }

  function dispatchMemoryTrigger(trigger: TriggerEvent): void {
    const promise = Promise.resolve()
      .then(() => dispatchTrigger(trigger))
      .catch((error) => {
        if (options?.logDir) {
          void appendDaemonLog(options.logDir, {
            timestamp: new Date().toISOString(),
            event: "TRIGGER_FAILED",
            data: { error: error instanceof Error ? error.message : String(error) },
          }).catch(() => {});
        }
      })
      .finally(() => {
        activeRuns.delete(promise);
        void drainQueue();
      });
    activeRuns.add(promise);
  }

  async function writeLoopStatus(): Promise<void> {
    if (!options?.logDir) return;
    const statusPath = path.join(options.logDir, "daemon.status.json");
    const status: DaemonLoopStatus = {
      activeRuns: durableQueue?.counts().active ?? activeRuns.size,
      pendingRuns: durableQueue?.counts().pending ?? queue.length,
      deadLetterRuns: durableQueue?.counts().deadLetter,
      rejectedTriggers: admission.stats.rejected,
      duplicateTriggers: admission.stats.duplicates,
      rateLimitedTriggers: admission.stats.rateLimited,
      updatedAt: new Date().toISOString(),
    };
    const tmpPath = `${statusPath}.tmp-${process.pid}-${Date.now()}`;
    await fs.writeFile(tmpPath, JSON.stringify(status), "utf-8");
    await fs.rename(tmpPath, statusPath);
  }

  const triggerCallback: TriggerCallback = async (trigger) => {
    // Log the activation
    if (options?.logDir) {
      const data = isAutomationTriggerEvent(trigger)
        ? {
          type: "automation",
          ruleId: trigger.rule.id,
          triggerType: trigger.rule.trigger.type,
          projectId: trigger.rule.target.projectId,
          boardProjectId: trigger.rule.target.boardProjectId,
        }
        : {
          type: trigger.type,
          processId: trigger.processId,
          entrypoint: trigger.entrypoint,
        };
      void appendDaemonLog(options.logDir, {
        timestamp: new Date().toISOString(),
        event: "TRIGGER_ACTIVATED",
        data,
      }).catch(() => {
        // Activation logging is best-effort and should never interrupt the loop.
      });
    }

    const admissionResult = admission.evaluate(trigger, {
      activeRuns: activeRuns.size,
      pendingRuns: durableQueue?.counts().pending ?? queue.length,
      maxConcurrent,
    });
    if (admissionResult.status === "rejected" || admissionResult.status === "duplicate") {
      if (options?.logDir) {
        void appendDaemonLog(options.logDir, {
          timestamp: new Date().toISOString(),
          event: admissionResult.status === "duplicate" ? "TRIGGER_DUPLICATE" : "TRIGGER_REJECTED",
          data: {
            reason: admissionResult.reason,
            retryAfterMs: admissionResult.retryAfterMs,
            queueDepth: admissionResult.queueDepth,
            fingerprint: admissionResult.fingerprint,
          },
        }).catch(() => {});
      }
      scheduleStatusWrite();
      return admissionResult;
    }

    if (durableQueue) {
      await durableQueue.enqueue(trigger).then(() => drainQueue()).catch((error) => {
        void appendDaemonLog(options!.logDir!, {
          timestamp: new Date().toISOString(),
          event: "TRIGGER_QUEUE_ERROR",
          data: { error: error instanceof Error ? error.message : String(error) },
        }).catch(() => {});
      });
      scheduleStatusWrite();
      return admissionResult;
    }

    if (activeRuns.size >= maxConcurrent) {
      queue.push(trigger);
      scheduleStatusWrite();
      return admissionResult.status === "accepted"
        ? { ...admissionResult, status: "deferred", queueDepth: queue.length }
        : admissionResult;
    }

    dispatchMemoryTrigger(trigger);
    scheduleStatusWrite();
    return admissionResult;
  };

  // Set up file triggers
  const fileTriggers = config.triggers
    .filter(isFileTriggerConfig);

  if (fileTriggers.length > 0) {
    const handle = createFileWatcher(fileTriggers, triggerCallback);
    handles.push(handle);
  }

  // Set up webhook triggers
  const webhookTriggers = config.triggers.filter(isWebhookAutomationRule);
  for (const rule of webhookTriggers) {
    try {
      const handle = await createWebhookListener({
        rule,
        onTrigger: triggerCallback,
      });
      handles.push(handle);
    } catch {
      // Port in use or other error — skip
    }
  }

  // Set up timer/cron triggers
  const timerTriggers = config.triggers.filter(isTimerAutomationRule);

  if (timerTriggers.length > 0) {
    const handle = createTimerScheduler(timerTriggers, triggerCallback);
    handles.push(handle);
  }

  await drainQueue();

  // Wait for abort signal
  if (options?.signal) {
    await new Promise<void>((resolve) => {
      if (options.signal!.aborted) {
        resolve();
        return;
      }
      options.signal!.addEventListener("abort", () => resolve(), { once: true });
    });
  }

  // Cleanup all handles
  for (const handle of handles) {
    if (handle.dispose) handle.dispose();
    if (handle.close) await handle.close();
  }
  for (const timer of retryTimers) {
    clearTimeout(timer);
  }

  // Wait for active runs to finish
  if (activeRuns.size > 0) {
    await Promise.allSettled([...activeRuns]);
  }

  // Wait for any in-flight status writes then write final status
  await statusWriteChain;
  try { await writeLoopStatus(); } catch { /* directory may be gone in tests */ }
}

interface AdmissionState {
  activeRuns: number;
  pendingRuns: number;
  maxConcurrent: number;
}

interface AdmissionController {
  stats: {
    rejected: number;
    duplicates: number;
    rateLimited: number;
  };
  evaluate(trigger: TriggerEvent, state: AdmissionState): TriggerAdmissionResult;
}

function createAdmissionController(config?: TriggerAdmissionConfig): AdmissionController {
  const seen = new Map<string, number>();
  const rateWindow: number[] = [];
  const stats = {
    rejected: 0,
    duplicates: 0,
    rateLimited: 0,
  };

  return {
    stats,
    evaluate(trigger, state) {
      const now = Date.now();
      const fingerprint = fingerprintTrigger(trigger);
      const dedupeWindowMs = config?.dedupeWindowMs ?? 0;
      if (dedupeWindowMs > 0) {
        for (const [key, expiresAt] of seen) {
          if (expiresAt <= now) seen.delete(key);
        }
        const existing = seen.get(fingerprint);
        if (existing && existing > now) {
          stats.duplicates += 1;
          return {
            status: "duplicate",
            reason: "dedupe-window",
            retryAfterMs: existing - now,
            queueDepth: state.pendingRuns,
            fingerprint,
          };
        }
      }

      const rateLimit = config?.rateLimit;
      if (rateLimit) {
        while (rateWindow.length > 0 && rateWindow[0] <= now - rateLimit.windowMs) {
          rateWindow.shift();
        }
        if (rateWindow.length >= rateLimit.maxTriggers) {
          stats.rejected += 1;
          stats.rateLimited += 1;
          return {
            status: "rejected",
            reason: "rate-limit",
            retryAfterMs: Math.max(0, rateWindow[0] + rateLimit.windowMs - now),
            queueDepth: state.pendingRuns,
            fingerprint,
          };
        }
      }

      const maxPendingRuns = config?.maxPendingRuns;
      if (maxPendingRuns !== undefined && state.pendingRuns >= maxPendingRuns && state.activeRuns >= state.maxConcurrent) {
        stats.rejected += 1;
        return {
          status: "rejected",
          reason: "queue-full",
          queueDepth: state.pendingRuns,
          fingerprint,
        };
      }

      if (dedupeWindowMs > 0) {
        seen.set(fingerprint, now + dedupeWindowMs);
      }
      if (rateLimit) {
        rateWindow.push(now);
      }

      return {
        status: state.activeRuns >= state.maxConcurrent ? "deferred" : "accepted",
        queueDepth: state.pendingRuns,
        fingerprint,
      };
    },
  };
}

function fingerprintTrigger(trigger: TriggerEvent): string {
  if (trigger.type === "file") {
    const path = typeof trigger.inputs?.path === "string" ? trigger.inputs.path : "";
    return path ? `file:path:${path}` : `file:${trigger.processId}:${trigger.entrypoint}`;
  }
  const deliveryId = typeof trigger.inputs?.deliveryId === "string" ? trigger.inputs.deliveryId : "";
  const sourceEvent = trigger.rule.trigger.type === "webhook" ? trigger.rule.trigger.sourceEvent ?? "" : "";
  const inputs = stableStringify(trigger.inputs ?? {});
  return `automation:${trigger.rule.trigger.type}:${trigger.rule.id}:${deliveryId}:${sourceEvent}:${inputs}`;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`;
}

/**
 * Read the daemon loop's runtime status from its status file.
 * Returns null if the file doesn't exist or is unreadable.
 */
export async function readDaemonLoopStatus(daemonDir: string): Promise<DaemonLoopStatus | null> {
  try {
    const statusPath = path.join(daemonDir, "daemon.status.json");
    const content = await fs.readFile(statusPath, "utf-8");
    return JSON.parse(content) as DaemonLoopStatus;
  } catch {
    return null;
  }
}
