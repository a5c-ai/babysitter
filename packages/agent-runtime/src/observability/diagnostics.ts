import type { DaemonConfig } from "../daemon/types";
import type { DaemonLoopStatus } from "../daemon/loop";
import type { RunHealthSnapshot } from "./types";

export type DiagnosticsRequestPath = "/health" | "/metrics" | "/config" | "/queue";

export interface DiagnosticsContext {
  health: RunHealthSnapshot;
  queue?: DaemonLoopStatus | null;
  config?: DaemonConfig | Record<string, unknown> | null;
}

export interface DiagnosticsSnapshot {
  health: RunHealthSnapshot;
  metrics: string;
  config: unknown;
  queue: DaemonLoopStatus | null;
}

export interface DiagnosticsResponse {
  status: number;
  contentType: string;
  body: unknown;
}

const SECRET_KEY_PATTERN = /(secret|token|api[-_]?key|authorization|password|credential|private[-_]?key)/i;

export function redactDiagnosticsConfig(value: unknown): unknown {
  return redactValue(value, "");
}

function redactValue(value: unknown, key: string): unknown {
  if (SECRET_KEY_PATTERN.test(key)) {
    return "[REDACTED]";
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, ""));
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      result[childKey] = redactValue(childValue, childKey);
    }
    return result;
  }
  return value;
}

export function buildDiagnosticsSnapshot(context: DiagnosticsContext): DiagnosticsSnapshot {
  const queue = context.queue ?? null;
  return {
    health: context.health,
    queue,
    config: redactDiagnosticsConfig(context.config ?? null),
    metrics: renderPrometheusMetrics({ health: context.health, queue }),
  };
}

export function renderPrometheusMetrics(context: Pick<DiagnosticsContext, "health" | "queue">): string {
  const metrics = context.health.metrics;
  const lines = [
    "# HELP babysitter_run_effect_latency_ms Run effect latency in milliseconds.",
    "# TYPE babysitter_run_effect_latency_ms gauge",
    `babysitter_run_effect_latency_ms{quantile="avg"} ${metrics.avgEffectLatencyMs}`,
    `babysitter_run_effect_latency_ms{quantile="0.5"} ${metrics.p50EffectLatencyMs}`,
    `babysitter_run_effect_latency_ms{quantile="0.95"} ${metrics.p95EffectLatencyMs}`,
    `babysitter_run_effect_latency_ms{quantile="0.99"} ${metrics.p99EffectLatencyMs}`,
    "# HELP babysitter_run_effects_total Run effects by state.",
    "# TYPE babysitter_run_effects_total gauge",
    `babysitter_run_effects_total{state="total"} ${metrics.totalEffects}`,
    `babysitter_run_effects_total{state="resolved"} ${metrics.resolvedEffects}`,
    `babysitter_run_effects_total{state="failed"} ${metrics.failedEffects}`,
    `babysitter_run_effects_total{state="pending"} ${metrics.pendingCount}`,
    "# HELP babysitter_run_error_rate Run effect error rate.",
    "# TYPE babysitter_run_error_rate gauge",
    `babysitter_run_error_rate ${metrics.errorRate}`,
    "# HELP babysitter_daemon_queue_active_runs Active daemon runs.",
    "# TYPE babysitter_daemon_queue_active_runs gauge",
    `babysitter_daemon_queue_active_runs ${context.queue?.activeRuns ?? 0}`,
    "# HELP babysitter_daemon_queue_pending_runs Pending daemon runs.",
    "# TYPE babysitter_daemon_queue_pending_runs gauge",
    `babysitter_daemon_queue_pending_runs ${context.queue?.pendingRuns ?? 0}`,
    "# HELP babysitter_daemon_queue_dead_letter_runs Dead-lettered daemon runs.",
    "# TYPE babysitter_daemon_queue_dead_letter_runs gauge",
    `babysitter_daemon_queue_dead_letter_runs ${context.queue?.deadLetterRuns ?? 0}`,
    "# HELP babysitter_daemon_trigger_rejections_total Trigger admissions rejected by the daemon.",
    "# TYPE babysitter_daemon_trigger_rejections_total counter",
    `babysitter_daemon_trigger_rejections_total ${context.queue?.rejectedTriggers ?? 0}`,
    "# HELP babysitter_daemon_trigger_duplicates_total Trigger admissions suppressed as duplicates by the daemon.",
    "# TYPE babysitter_daemon_trigger_duplicates_total counter",
    `babysitter_daemon_trigger_duplicates_total ${context.queue?.duplicateTriggers ?? 0}`,
    "# HELP babysitter_daemon_trigger_rate_limited_total Trigger admissions rejected by rate limiting.",
    "# TYPE babysitter_daemon_trigger_rate_limited_total counter",
    `babysitter_daemon_trigger_rate_limited_total ${context.queue?.rateLimitedTriggers ?? 0}`,
  ];
  return `${lines.join("\n")}\n`;
}

export function handleDiagnosticsRequest(
  requestPath: DiagnosticsRequestPath,
  context: DiagnosticsContext,
): DiagnosticsResponse {
  switch (requestPath) {
    case "/health":
      return { status: 200, contentType: "application/json", body: context.health };
    case "/metrics":
      return {
        status: 200,
        contentType: "text/plain; version=0.0.4",
        body: renderPrometheusMetrics({ health: context.health, queue: context.queue }),
      };
    case "/config":
      return {
        status: 200,
        contentType: "application/json",
        body: redactDiagnosticsConfig(context.config ?? null),
      };
    case "/queue":
      return {
        status: 200,
        contentType: "application/json",
        body: context.queue ?? null,
      };
  }
}
