/**
 * GAP-REMOTE-001: Daemon Mode — Type definitions.
 */

import type {
  AutomationRule,
  TimerAutomationRule,
  WebhookAutomationRule,
} from "@a5c-ai/agent-mux-core";

// ── Config types ────────────────────────────────────────────────────────────

export interface DaemonConfig {
  workspace: string;
  triggers: TriggerConfig[];
  maxConcurrentRuns?: number;
}

export interface FileTriggerConfig {
  type: "file";
  pattern: string;
  processId: string;
  entrypoint: string;
  debounceMs?: number;
}

export type TriggerConfig = FileTriggerConfig | AutomationRule;

export interface FileTriggerEvent {
  type: "file";
  processId: string;
  entrypoint: string;
  inputs?: Record<string, unknown>;
}

export interface AutomationTriggerEvent {
  type: "automation";
  rule: AutomationRule;
  inputs?: Record<string, unknown>;
}

export type TriggerEvent = FileTriggerEvent | AutomationTriggerEvent;

export function isFileTriggerConfig(trigger: TriggerConfig): trigger is FileTriggerConfig {
  return "type" in trigger && trigger.type === "file";
}

export function isTimerAutomationRule(trigger: TriggerConfig): trigger is TimerAutomationRule {
  return "trigger" in trigger && trigger.trigger.type === "timer";
}

export function isWebhookAutomationRule(trigger: TriggerConfig): trigger is WebhookAutomationRule {
  return "trigger" in trigger && trigger.trigger.type === "webhook";
}

export function isFileTriggerEvent(event: TriggerEvent): event is FileTriggerEvent {
  return event.type !== "automation";
}

export function isAutomationTriggerEvent(event: TriggerEvent): event is AutomationTriggerEvent {
  return event.type === "automation";
}

export interface LegacyTriggerConfig {
  type: "file" | "webhook" | "timer";
  processId: string;
  entrypoint: string;
  pattern?: string;
  port?: number;
  cron?: string;
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
  rule: WebhookAutomationRule;
  onTrigger: TriggerCallback;
}

export interface WebhookListenerHandle {
  close(): Promise<void>;
  port: number;
}

// ── Shared types ────────────────────────────────────────────────────────────

export type TriggerCallback = (trigger: TriggerEvent) => void | Promise<void>;

// ── Daemon metadata (persisted to daemon.json) ──────────────────────────────

export interface DaemonMetadata {
  workspace: string;
  startedAt: string;
  triggers: TriggerConfig[];
  maxConcurrentRuns: number;
  pid: number;
}
