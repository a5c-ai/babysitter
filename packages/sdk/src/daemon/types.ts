/**
 * GAP-REMOTE-001: Daemon Mode — Type definitions.
 */

// ── Config types ────────────────────────────────────────────────────────────

export interface DaemonConfig {
  workspace: string;
  triggers: TriggerConfig[];
  maxConcurrentRuns?: number;
}

export interface TriggerConfig {
  type: "file" | "webhook" | "timer";
  processId: string;
  entrypoint: string;
  pattern?: string;
  port?: number;
  cron?: string;
  debounceMs?: number;
}

export interface FileTriggerConfig {
  pattern: string;
  processId: string;
  entrypoint: string;
  debounceMs?: number;
}

// ── Lifecycle types ─────────────────────────────────────────────────────────

export interface DaemonStartOptions {
  daemonDir: string;
  workspace: string;
  foreground?: boolean;
  config?: DaemonConfig;
}

export interface DaemonStartOutput {
  pid: number;
  daemonDir: string;
  startedAt: string;
}

export interface DaemonStopOptions {
  daemonDir: string;
  gracePeriodMs?: number;
}

export interface DaemonStopOutput {
  pid: number;
  stoppedAt: string;
}

export interface DaemonStatusOptions {
  daemonDir: string;
}

export interface DaemonStatusOutput {
  running: boolean;
  pid?: number;
  uptime?: number;
  startedAt?: string;
  activeTriggers?: number;
  pendingRuns?: number;
}

// ── File watcher types ──────────────────────────────────────────────────────

export interface FileWatcherHandle {
  dispose(): void;
}

// ── Webhook types ───────────────────────────────────────────────────────────

export interface WebhookListenerOptions {
  port: number;
  onTrigger: TriggerCallback;
  authToken?: string;
}

export interface WebhookListenerHandle {
  close(): Promise<void>;
  port: number;
}

// ── Shared types ────────────────────────────────────────────────────────────

export type TriggerCallback = (trigger: {
  processId: string;
  entrypoint: string;
  inputs?: Record<string, unknown>;
}) => void | Promise<void>;

// ── Daemon metadata (persisted to daemon.json) ──────────────────────────────

export interface DaemonMetadata {
  workspace: string;
  startedAt: string;
  triggers: TriggerConfig[];
  maxConcurrentRuns: number;
  pid: number;
}
