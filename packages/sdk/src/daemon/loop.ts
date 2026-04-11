/**
 * GAP-REMOTE-001: Daemon Loop — main event loop with concurrent run pool.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { DaemonConfig, TriggerCallback, FileTriggerConfig } from "./types";
import { createFileWatcher } from "./fileWatcher";
import { createWebhookListener } from "./webhookListener";
import { createTimerScheduler, type TimerTriggerConfig } from "./timerScheduler";
import { appendDaemonLog } from "./daemonLog";

export interface DaemonLoopOptions {
  onTrigger?: TriggerCallback;
  signal?: AbortSignal;
  logDir?: string;
}

export interface DaemonLoopStatus {
  activeRuns: number;
  pendingRuns: number;
  updatedAt: string;
}

export async function runDaemonLoop(
  config: DaemonConfig,
  options?: DaemonLoopOptions,
): Promise<void> {
  const maxConcurrent = config.maxConcurrentRuns ?? 4;
  const handles: Array<{ dispose?: () => void; close?: () => Promise<void> }> = [];
  const activeRuns = new Set<Promise<void>>();
  const queue: Array<{ processId: string; entrypoint: string; inputs?: Record<string, unknown> }> = [];

  function drainQueue(): void {
    while (queue.length > 0 && activeRuns.size < maxConcurrent) {
      const next = queue.shift()!;
      dispatchTrigger(next);
    }
    void writeLoopStatus();
  }

  function dispatchTrigger(trigger: { processId: string; entrypoint: string; inputs?: Record<string, unknown> }): void {
    if (options?.onTrigger) {
      const result = options.onTrigger(trigger);
      // If onTrigger returns a Promise, track it for concurrency
      if (result != null && typeof result.then === "function") {
        const promise = result.then(() => {
          activeRuns.delete(promise);
          drainQueue();
        }, () => {
          activeRuns.delete(promise);
          drainQueue();
        });
        activeRuns.add(promise);
      }
    }
  }

  async function writeLoopStatus(): Promise<void> {
    if (!options?.logDir) return;
    const statusPath = path.join(options.logDir, "daemon.status.json");
    const status: DaemonLoopStatus = {
      activeRuns: activeRuns.size,
      pendingRuns: queue.length,
      updatedAt: new Date().toISOString(),
    };
    const tmpPath = `${statusPath}.tmp-${process.pid}`;
    await fs.writeFile(tmpPath, JSON.stringify(status), "utf-8");
    await fs.rename(tmpPath, statusPath);
  }

  const triggerCallback: TriggerCallback = (trigger) => {
    // Log the activation
    if (options?.logDir) {
      void appendDaemonLog(options.logDir, {
        timestamp: new Date().toISOString(),
        event: "TRIGGER_ACTIVATED",
        data: { processId: trigger.processId, entrypoint: trigger.entrypoint },
      });
    }

    if (activeRuns.size >= maxConcurrent) {
      queue.push(trigger);
      void writeLoopStatus();
      return;
    }

    dispatchTrigger(trigger);
    void writeLoopStatus();
  };

  // Set up file triggers
  const fileTriggers = config.triggers
    .filter((t) => t.type === "file")
    .map((t): FileTriggerConfig => ({
      pattern: t.pattern ?? "",
      processId: t.processId,
      entrypoint: t.entrypoint,
      debounceMs: t.debounceMs,
    }));

  if (fileTriggers.length > 0) {
    const handle = createFileWatcher(fileTriggers, triggerCallback);
    handles.push(handle);
  }

  // Set up webhook triggers
  const webhookTriggers = config.triggers.filter((t) => t.type === "webhook");
  for (const wt of webhookTriggers) {
    if (wt.port) {
      try {
        const handle = await createWebhookListener({
          port: wt.port,
          onTrigger: triggerCallback,
        });
        handles.push(handle);
      } catch {
        // Port in use or other error — skip
      }
    }
  }

  // Set up timer/cron triggers
  const timerTriggers = config.triggers
    .filter((t) => t.type === "timer" && t.cron)
    .map((t): TimerTriggerConfig => ({
      cron: t.cron!,
      processId: t.processId,
      entrypoint: t.entrypoint,
    }));

  if (timerTriggers.length > 0) {
    const handle = createTimerScheduler(timerTriggers, triggerCallback);
    handles.push(handle);
  }

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

  // Wait for active runs to finish
  if (activeRuns.size > 0) {
    await Promise.allSettled([...activeRuns]);
  }
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
