/**
 * GAP-REMOTE-001: Daemon Loop — main event loop with concurrent run pool.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { DaemonConfig, TriggerCallback, TriggerEvent } from "./types";
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
      return options.onTrigger(trigger);
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
      updatedAt: new Date().toISOString(),
    };
    const tmpPath = `${statusPath}.tmp-${process.pid}-${Date.now()}`;
    await fs.writeFile(tmpPath, JSON.stringify(status), "utf-8");
    await fs.rename(tmpPath, statusPath);
  }

  const triggerCallback: TriggerCallback = (trigger) => {
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

    if (durableQueue) {
      void durableQueue.enqueue(trigger).then(() => drainQueue()).catch((error) => {
        void appendDaemonLog(options!.logDir!, {
          timestamp: new Date().toISOString(),
          event: "TRIGGER_QUEUE_ERROR",
          data: { error: error instanceof Error ? error.message : String(error) },
        }).catch(() => {});
      });
      scheduleStatusWrite();
      return;
    }

    if (activeRuns.size >= maxConcurrent) {
      queue.push(trigger);
      scheduleStatusWrite();
      return;
    }

    dispatchMemoryTrigger(trigger);
    scheduleStatusWrite();
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
