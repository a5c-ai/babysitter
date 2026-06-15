export { startDaemon, stopDaemon, getDaemonStatus, watchDaemon } from "./lifecycle";
export { loadDaemonConfig, writeDaemonConfig } from "./config";
export { createFileWatcher } from "./fileWatcher";
export { createWebhookListener } from "./webhookListener";
export { createTimerScheduler } from "./timerScheduler";
export { runDaemonLoop, readDaemonLoopStatus } from "./loop";
export { appendDaemonLog, readDaemonLog } from "./daemonLog";
export { DurableTriggerQueue } from "./durableQueue";
export type {
  DaemonConfig,
  DaemonStartOptions,
  DaemonStartOutput,
  DaemonStopOptions,
  DaemonStopOutput,
  DaemonStatusOptions,
  DaemonStatusOutput,
  DaemonWatchdogOptions,
  DaemonWatchdogOutput,
  DaemonMetadata,
  TriggerConfig,
  TriggerEvent,
  FileTriggerEvent,
  AutomationTriggerEvent,
  FileTriggerConfig,
  FileWatcherHandle,
  WebhookListenerOptions,
  WebhookListenerHandle,
  TriggerCallback,
  TriggerAdmissionConfig,
  TriggerAdmissionResult,
  TriggerAdmissionStatus,
  TriggerRateLimitConfig,
} from "./types";
export type { TimerSchedulerHandle } from "./timerScheduler";
export type { DaemonLoopOptions, DaemonLoopStatus } from "./loop";
export type { DaemonLogEntry, DaemonLogLevel, DaemonLogPolicy } from "./daemonLog";
export type {
  DurableTriggerQueueOptions,
  DurableTriggerRecord,
  DurableTriggerState,
} from "./durableQueue";

// Re-export ApiResult from the local utility so consumers can use the same type
export type { ApiResult } from "../apiResult";
